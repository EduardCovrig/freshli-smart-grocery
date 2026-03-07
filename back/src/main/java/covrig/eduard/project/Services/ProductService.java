package covrig.eduard.project.Services;

import covrig.eduard.project.Models.*;
import covrig.eduard.project.Repositories.BrandRepository;
import covrig.eduard.project.Repositories.CategoryRepository;
import covrig.eduard.project.Repositories.ProductBatchRepository;
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
    private final ProductBatchRepository batchRepository;
    private final String UPLOAD_DIR="../front/public/products/"; //din calea absoluta (,adica de unde e pom.xml)

    public ProductService(ProductRepository productRepository, ProductMapper productMapper,
                          BrandRepository brandRepository, CategoryRepository categoryRepository, ProductBatchRepository productBatchRepository) {
        this.productRepository = productRepository;
        this.productMapper=productMapper;
        this.brandRepository=brandRepository;
        this.categoryRepository=categoryRepository;
        this.batchRepository = productBatchRepository;
    }
    // Modifica metoda calculateSubtotalForQuantity pentru a calcula corect reducerea de expirare:
    private Double getDiscountedPriceOnlyForDate(Product product, LocalDate expirationDate) {
        if (expirationDate == null) return product.getPrice();
        long days = ChronoUnit.DAYS.between(LocalDate.now(), expirationDate);

        if (days < 0) return product.getPrice() * 0.25;
        if (days < 1) return product.getPrice() * 0.25; // -75%
        if (days <= 3) return product.getPrice() * 0.50; // -50%
        if (days <= 7) return product.getPrice() * 0.80; // -20%

        return product.getPrice();
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

        List<ProductBatch> activeBatches = batchRepository.findByIsExpiredFalse();
        LocalDate today = LocalDate.now();
        int expiredCount = 0;

        for (ProductBatch batch : activeBatches) {
            long days = ChronoUnit.DAYS.between(today, batch.getExpirationDate());

            // Daca a expirat
            if (days < 0) {
                batch.setIsExpired(true); // O marcam ca expirata, nu o mai aducem in queries
                batchRepository.save(batch);
                expiredCount++;
                log.warn("ELIMINARE AUTOMATA: Lotul {} a fost eliminat pentru produsul ID: {}.", batch.getId(), batch.getProduct().getId());
            }
        }
        log.info("Cron job finalizat. Loturi expirate scoase din vanzare: " + expiredCount);
    }

    private ProductResponseDTO enrichProductDto(Product p) {
        ProductResponseDTO dto = productMapper.toDto(p);
        Discount activeDiscount = findActiveDiscount(p);

        // 1. Preluam toate loturile valide, sortate de la cel mai vechi la cel mai nou
        List<ProductBatch> validBatches = batchRepository.findByProductIdAndIsExpiredFalseOrderByExpirationDateAsc(p.getId());

        // 2. Calculam dinamic STOC TOTAL si DATA EXPIRARE URMĂTOARE (cel mai vechi lot valabil)
        int totalStock = 0;
        int nearExpiryStock = 0;
        LocalDate closestExpiration = null;
        LocalDate today = LocalDate.now();

        for (ProductBatch batch : validBatches) {
            totalStock += batch.getQuantity();

            // Setam data celui mai vechi lot curent
            if (closestExpiration == null) {
                closestExpiration = batch.getExpirationDate();
            }

            // Verificam cate din acest lot intra la Clearance
            long daysToExpiry = ChronoUnit.DAYS.between(today, batch.getExpirationDate());
            if (daysToExpiry <= 7 && daysToExpiry >= 0) {
                nearExpiryStock += batch.getQuantity();
            }
        }

        dto.setStockQuantity(totalStock);
        dto.setNearExpiryQuantity(nearExpiryStock);
        dto.setExpirationDate(closestExpiration); // Va fi null daca nu sunt loturi

        // 3. Calculam PRETURILE
        Double freshPrice = p.getPrice();
        if (activeDiscount != null) {
            freshPrice = applyDiscount(p.getPrice(), activeDiscount.getDiscountValue(), activeDiscount.getDiscountType());
        }
        dto.setFreshPrice(Math.round(freshPrice * 100.0) / 100.0);

        Double manualDiscountPrice = freshPrice;
        Double expiryPrice = p.getPrice();
        boolean hasExpiryDiscount = false;

        if (nearExpiryStock > 0 && closestExpiration != null) {
            // Calculam reducerea pe baza celui mai urgent lot
            long days = ChronoUnit.DAYS.between(today, closestExpiration);
            if (days < 0) expiryPrice = p.getPrice() * 0.25;
            else if (days < 1) expiryPrice = p.getPrice() * 0.25; // -75%
            else if (days <= 3) expiryPrice = p.getPrice() * 0.50; // -50%
            else if (days <= 7) expiryPrice = p.getPrice() * 0.80; // -20%

            hasExpiryDiscount = true;
        }

        if (hasExpiryDiscount && expiryPrice < manualDiscountPrice) {
            dto.setCurrentPrice(Math.round(expiryPrice * 100.0) / 100.0);
            dto.setHasActiveDiscount(true);
            dto.setDiscountType("PERCENT");
            double totalPercent = ((p.getPrice() - expiryPrice) / p.getPrice()) * 100;
            dto.setDiscountValue(Math.round(totalPercent * 10.0) / 10.0);
        } else if (activeDiscount != null) {
            dto.setCurrentPrice(manualDiscountPrice);
            dto.setHasActiveDiscount(true);
            dto.setDiscountValue(activeDiscount.getDiscountValue());
            dto.setDiscountType(activeDiscount.getDiscountType());
        } else {
            dto.setCurrentPrice(p.getPrice());
            dto.setHasActiveDiscount(false);
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
        // Salvam produsul FARA loturi momentan
        productToSave = productRepository.save(productToSave);

        // CREARE PRIMUL LOT (Daca avem stoc initial)
        if (creationDTO.getStockQuantity() != null && creationDTO.getStockQuantity() > 0) {
            ProductBatch initialBatch = new ProductBatch();
            initialBatch.setProduct(productToSave);
            initialBatch.setQuantity(creationDTO.getStockQuantity());
            // Daca nu primeste data, ii punem una fictiva departe (ex: peste 10 ani) pt cele non-perisabile
            initialBatch.setExpirationDate(creationDTO.getExpirationDate() != null ? creationDTO.getExpirationDate() : LocalDate.now().plusYears(10));
            initialBatch.setIsExpired(false);

            // Initializam lista de loturi a produsului si adaugam
            List<ProductBatch> batches = new java.util.ArrayList<>();
            batches.add(initialBatch);
            productToSave.setBatches(batches);

            productRepository.save(productToSave); // Salvam iar ca sa persistam lotul cascade
        }


        // LOGICA IMAGINI
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

    // METODA NEFOLOSITA ACUM
    public ProductResponseDTO updateProductStock(Long id, Integer incomingStock) {
        throw new RuntimeException("Use addNewBatch instead."); //not used anymore
    }

    // NOUA METODA PENTRU ADAUGARE LOT
    public ProductResponseDTO addNewBatch(Long id, Integer incomingStock, LocalDate expirationDate) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit."));

        ProductBatch newBatch = new ProductBatch();
        newBatch.setProduct(existingProduct);
        newBatch.setQuantity(incomingStock);
        newBatch.setExpirationDate(expirationDate != null ? expirationDate : LocalDate.now().plusYears(10));
        newBatch.setIsExpired(false);

        batchRepository.save(newBatch);

        return enrichProductDto(existingProduct);
    }

    public ProductResponseDTO updateProductExpiration(Long id, LocalDate newDate) {
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produsul cu ID-ul " + id + " nu a fost gasit."));

        existingProduct.setExpirationDate(newDate);
        return enrichProductDto(productRepository.save(existingProduct));
    }


}