package covrig.eduard.project.Services;

import covrig.eduard.project.Models.*;
import covrig.eduard.project.Repositories.BrandRepository;
import covrig.eduard.project.Repositories.CategoryRepository;
import covrig.eduard.project.Repositories.ProductRepository;
import covrig.eduard.project.dtos.product.ProductCreationDTO;
import covrig.eduard.project.dtos.product.ProductResponseDTO;
import covrig.eduard.project.mappers.ProductMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional //e necesar cand foloesc fetchtype.lazy pe models
@Slf4j //pt cron job, creeaza obiectul log pentru a da log-uri in consola
//default readonly=false -> se foloseste default cu optiunile astea pentru toate metodele publice, daca nu se mentioneaza altfel cu o
//adnotare noua, cum e la primele 3 metode de tip GET.
public class ProductService {
    private final ProductRepository productRepository;
    //FINAL PE CAMP CAND FACI CU CONSTRUCTOR.
    //FARA FINAL, CAND FACI CU AUTOWIRED DIRECT PE EL
    private final ProductMapper productMapper;

    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final String UPLOAD_DIR="../front/public/products/"; //din calea absoluta (,adica de unde e pom.xml)

    public ProductService(ProductRepository productRepository,ProductMapper productMapper,
                          BrandRepository brandRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.productMapper=productMapper;
        this.brandRepository=brandRepository;
        this.categoryRepository=categoryRepository;
    }
    public Double calculateSubtotalForQuantity(Product product, Integer requestedQty, boolean forceFreshPrice) {
        if (product.getStockQuantity() <= 0) return 0.0;

        //1. Calculam pretul cu reducerea normala (daca există în tabela discount)
        Double baseOrManualDiscountPrice = product.getPrice();
        Discount activeDiscount = findActiveDiscount(product);
        if (activeDiscount != null) {
            baseOrManualDiscountPrice = applyDiscount(product.getPrice(), activeDiscount.getDiscountValue(), activeDiscount.getDiscountType());
        }

        //2.DACA USERUL VREA FRESH => Primeste prețul care include doar reducerea manuala, NU pe cea de expirare
        if (forceFreshPrice) {
            return requestedQty * baseOrManualDiscountPrice;
        }

        //3.DACA USERUL VREA REDUCED => Primeste cel mai mic pret dintre reducerea manuala si cea de expirare
        Double expiryDiscountPrice = getDiscountedPriceOnly(product);
        Double bestPrice = Math.min(baseOrManualDiscountPrice, expiryDiscountPrice);

        log.info("Calcul pret pentru {}: {} bucati la pret de {}.", product.getName(), requestedQty, bestPrice);

        return requestedQty * bestPrice;
    }
    //Cat ar fi pretul redus pentru o singura unitate din lotul critic
    private Double getDiscountedPriceOnly(Product product) {
        if (product.getExpirationDate() == null) return product.getPrice();
        long days = ChronoUnit.DAYS.between(LocalDate.now(), product.getExpirationDate());

        if (days < 0) return product.getPrice() * 0.25;
        if (days < 1) return product.getPrice() * 0.25; // -75%
        if (days <= 3) return product.getPrice() * 0.50; // -50%
        if (days <= 7) return product.getPrice() * 0.80; // -20%

        return product.getPrice();
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> searchProductsByName(String query) {
        List<Product> products = productRepository.searchProductsByNameOrBrand(query);

        return products.stream()
                .map(this::enrichProductDto)
                .collect(Collectors.toList());
    }



    private Double applyDiscount(Double originalPrice, Double value, String type) {
        if (type == null || value == null) return originalPrice;

        // Curatam string-ul de spatii si il facem mare, apoi cautam cuvantul cheie
        String cleanType = type.trim().toUpperCase();

        if (cleanType.contains("PERCENT")) {
            return originalPrice - (originalPrice * value / 100.0);
        } else if (cleanType.contains("FIXED")) {
            return Math.max(originalPrice - value, 0.0);
        }

        return originalPrice;
    }
    public Discount findActiveDiscount(Product product)
    {
        if(product.getDiscounts()==null || product.getDiscounts().isEmpty()) return null;
        Instant now=Instant.now();
        return product.getDiscounts().stream().filter(d ->
                d.getDiscountStartDate().isBefore(now)&&d.getDiscountEndDate().isAfter(now)).findFirst().orElse(null);
    }

    @Scheduled(cron = "0 0 0 * * *") //ora 0 minutul 0 secunda 0, fiecare zi a lunii, fiecare luna din an, fiecare zi a saptamanii
    public void autoManageLotsAndExpirations() {
        log.info("Rulare algoritm automat de gestionare loturi si expirari...");
        List<Product> products = productRepository.findAll();


        for (Product p : products) {
            if (p.getExpirationDate() != null) {
                long days = ChronoUnit.DAYS.between(LocalDate.now(), p.getExpirationDate());

                // 0. AUTO-CORECTARE (daca data e > 7 zile, dar are bug si e din greseala pus stoc de expirare)
                if (days > 7 && p.getNearExpiryQuantity() > 0) {
                    p.setNearExpiryQuantity(0);
                    productRepository.save(p);
                    log.info("AUTO-CORECTARE: Produsul {} a fost scos din Clearance (mai are {} zile).", p.getName(), days);
                }

                // 1. MARCARE LOT (daca intra azi in zona de 7 zile)
                if (days <= 7 && days >= 0 && p.getNearExpiryQuantity() == 0) {
                    p.setNearExpiryQuantity(p.getStockQuantity());
                    productRepository.save(p);
                    log.info("LOT CRITIC MARCAT: Produsul {} are {} unitati la pret dinamic.", p.getName(), p.getNearExpiryQuantity());
                }

                // 2. ELIMINARE LOT EXPIRAT (Daca data a trecut)
                // scadem tot ce a ramas din lotul marcat ca nevandut
                if (days < 0 && p.getNearExpiryQuantity() > 0) {
                    int expiredQty = p.getNearExpiryQuantity();
                    p.setStockQuantity(Math.max(0, p.getStockQuantity() - expiredQty));
                    p.setNearExpiryQuantity(0); // Lotul a fost eliminat
                    productRepository.save(p);
                    log.warn("ELIMINARE AUTOMATA: {} unitati expirate eliminate pentru {}.", expiredQty, p.getName());
                }
            }
        }
    }
    private ProductResponseDTO enrichProductDto(Product p) {
        ProductResponseDTO dto = productMapper.toDto(p);

        // 1. Calculam prețul bazat pe REDUCERE manuala (Table Discount)
        Discount activeDiscount = findActiveDiscount(p);
        Double manualDiscountPrice = p.getPrice();
        boolean hasManualDiscount = false;

        if (activeDiscount != null) {
            manualDiscountPrice = applyDiscount(p.getPrice(), activeDiscount.getDiscountValue(), activeDiscount.getDiscountType());
            hasManualDiscount = true;
        }

        // 2. Calculam prețul bazat pe EXPIRARE (Smart Logic)
        // ATENȚIE: O calculam DOAR daca exista macar o bucata în stocul de expirare!
        Double expiryPrice = p.getPrice();
        boolean hasExpiryDiscount = false;

        if (p.getNearExpiryQuantity() != null && p.getNearExpiryQuantity() > 0) {
            expiryPrice = getDiscountedPriceOnly(p);
            if (expiryPrice < p.getPrice()) {
                hasExpiryDiscount = true;
            }
        }

        // 3. LOGICA "BEST PRICE" (Cel mai mic pret)
        if (hasExpiryDiscount && expiryPrice <= manualDiscountPrice) {
            // CAZ A: Expirarea ofera cel mai bun pret
            dto.setCurrentPrice(expiryPrice);
            dto.setHasActiveDiscount(true);
            dto.setDiscountType("PERCENT");

            double percent = ((p.getPrice() - expiryPrice) / p.getPrice()) * 100;
            dto.setDiscountValue(Math.round(percent * 100.0) / 100.0);

        } else if (hasManualDiscount) {
            // CAZ B: Reducerea Manuala este mai buna (sau e singura)
            dto.setCurrentPrice(manualDiscountPrice);
            dto.setHasActiveDiscount(true);
            dto.setDiscountValue(activeDiscount.getDiscountValue());
            dto.setDiscountType(activeDiscount.getDiscountType());

        } else {
            // CAZ C: Nicio reducere
            dto.setCurrentPrice(p.getPrice());
            dto.setHasActiveDiscount(false);
            dto.setDiscountValue(0.0);
        }

        return dto;
    }

    //1. CITIRE
    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getAllProducts() {
        return productRepository.findAll().stream().map(this::enrichProductDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponseDTO getProductById(Long id) {
        return productRepository.findById(id)
                .map(this::enrichProductDto)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit."));
    }

    //filtrare produse care necesita discount (expira)
    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getProductsExpiringBefore(LocalDate date) {
        return productRepository.findByExpirationDateBefore(date).stream()
                .map(this::enrichProductDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getProductsByBrandName(String brandName) {
        return productRepository.findByBrandName(brandName).stream()
                .map(this::enrichProductDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getProductsByCategoryName(String categoryName) {
        return productRepository.findByCategoryName(categoryName).stream()
                .map(this::enrichProductDto)
                .collect(Collectors.toList());
    }

    // SCRIERE

    public ProductResponseDTO createProduct(ProductCreationDTO creationDTO) {
        Product productToSave = productMapper.toEntity(creationDTO);
        //mapeaza campurile simple


        //MAPARE CAMPURI COMPLEXE (FK)
        Brand brand = brandRepository.findById(creationDTO.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand-ul cu ID-ul " + creationDTO.getBrandId() + " nu a fost gasit."));
        Category category = categoryRepository.findById(creationDTO.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Categoria cu ID-ul " + creationDTO.getCategoryId() + " nu a fost gasita."));

        productToSave.setBrand(brand);
        productToSave.setCategory(category);
        productToSave.setNearExpiryQuantity(0); // Produs nou, nu e marcat ca si cum expira curand

        if (creationDTO.getImageUrls() != null) { //seteaza imaginile
            List<ProductImage> images = new java.util.ArrayList<>();
            for (String url : creationDTO.getImageUrls()) {
                ProductImage img = new ProductImage();
                img.setImageUrl(url);
                img.setProduct(productToSave); // setam si legatura inversa pentru imagine -> product
                images.add(img);
            }
            productToSave.setImages(images);
        }

        if (creationDTO.getAttributes() != null) { //gestionare atribute (valori nutritionale, etc)
            List<covrig.eduard.project.Models.ProductAttribute> attrs = new java.util.ArrayList<>();
            creationDTO.getAttributes().forEach((key, value) -> {
                covrig.eduard.project.Models.ProductAttribute attr = new covrig.eduard.project.Models.ProductAttribute();
                attr.setName(key);
                attr.setValue(value);
                attr.setProduct(productToSave); // setam si legatura inversa pentru atribut -> product
                attrs.add(attr);
            });
            productToSave.setAttributes(attrs);
        }

        return enrichProductDto(productRepository.save(productToSave));
    }

    //UPDATE
    public ProductResponseDTO updateProduct(Long id, ProductCreationDTO updateDTO) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit pentru actualizare."));

        existingProduct.setName(updateDTO.getName());
        existingProduct.setPrice(updateDTO.getPrice());
        existingProduct.setStockQuantity(updateDTO.getStockQuantity());
        existingProduct.setUnitOfMeasure(updateDTO.getUnitOfMeasure());

        //Daca adminul schimba data, se  reseteaza si nearExpiryQuantity
        if (updateDTO.getExpirationDate() != null && !updateDTO.getExpirationDate().equals(existingProduct.getExpirationDate())) {
            existingProduct.setExpirationDate(updateDTO.getExpirationDate());
            existingProduct.setNearExpiryQuantity(0);
        }
        if (updateDTO.getStockQuantity() < existingProduct.getNearExpiryQuantity()) {
            existingProduct.setNearExpiryQuantity(updateDTO.getStockQuantity());
        }

        Brand brand = brandRepository.findById(updateDTO.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand-ul cu ID-ul " + updateDTO.getBrandId() + " nu a fost gasit."));
        Category category = categoryRepository.findById(updateDTO.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Categoria cu ID-ul " + updateDTO.getCategoryId() + " nu a fost gasita."));

        existingProduct.setBrand(brand);
        existingProduct.setCategory(category);


        return enrichProductDto(productRepository.save(existingProduct));
    }

    public ProductResponseDTO updateProductPrice(Long id, Double newPrice) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit."));

        existingProduct.setPrice(newPrice);

        return enrichProductDto(productRepository.save(existingProduct));
    }
    //DELETE

    public ProductResponseDTO deleteProduct(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit pentru stergere."));
        // STERGEREA fizica a imnaginilor
        if (p.getImages() != null && !p.getImages().isEmpty()) {
            for (ProductImage img : p.getImages()) {
                String imageUrl = img.getImageUrl(); // ex: "/products/brand-produs.jpg"

                if (imageUrl != null && imageUrl.startsWith("/products/")) {
                    String fileName = imageUrl.substring("/products/".length());
                    try {
                        Path filePath = Paths.get(UPLOAD_DIR + fileName);
                        Files.deleteIfExists(filePath);
                        log.info("imaginea a fost stearsa fizic din memorie: {}", filePath.toString());
                    } catch (Exception e) {
                        log.error("Nu s-a putut sterge imaginea fizica: {}", imageUrl, e);
                    }
                }
            }
        }
        //sterge produsul din db, care sterge automat si randul din procut_image deoarece are CASCADE=ALL
        productRepository.delete(p);
        return productMapper.toDto(p);
    }
    //Metoda pentru a elimina DOAR lotul care expira manual de catre admin
    public ProductResponseDTO dropClearanceStock(Long id) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit."));

        int expiredQty = existingProduct.getNearExpiryQuantity();

        // Scadem din stocul total cantitatea stricata/expirata
        existingProduct.setStockQuantity(Math.max(0, existingProduct.getStockQuantity() - expiredQty));
        // Resetam lotul critic
        existingProduct.setNearExpiryQuantity(0);

        return enrichProductDto(productRepository.save(existingProduct));
    }

    public ProductResponseDTO updateProductStock(Long id, Integer newStock) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit."));

        existingProduct.setStockQuantity(newStock);

        // Ca sa evitam un bug: daca stocul nou e mai mic decat cantitatea care expira, trunchiem si cantitatea care expira
        if (existingProduct.getNearExpiryQuantity() > newStock) {
            existingProduct.setNearExpiryQuantity(newStock);
        }

        return enrichProductDto(productRepository.save(existingProduct));
    }

    public ProductResponseDTO updateProductExpiration(Long id, LocalDate newDate) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit."));

        existingProduct.setExpirationDate(newDate);
        return enrichProductDto(productRepository.save(existingProduct));
    }


}