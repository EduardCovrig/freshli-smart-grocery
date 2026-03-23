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
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional //e necesar cand foloesc fetchtype.lazy pe models
@Slf4j //pt cron job, creeaza obiectul log pentru a da log-uri in consola
//default readonly=false -> se foloseste default cu optiunile astea pentru toate metodele publice, daca nu se mentioneaza altfel cu o
//adnotare noua, cum e la primele 3 metode de tip GET.
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductBatchRepository batchRepository;
    private final String UPLOAD_DIR="../front/public/products/";

    public ProductService(ProductRepository productRepository, ProductMapper productMapper,
                          BrandRepository brandRepository, CategoryRepository categoryRepository,
                          ProductBatchRepository productBatchRepository) {
        this.productRepository = productRepository;
        this.productMapper=productMapper;
        this.brandRepository=brandRepository;
        this.categoryRepository=categoryRepository;
        this.batchRepository = productBatchRepository;
    }

    // 1. SINCRONIZATORUL DE LOTURI
    public void syncProductAggregates(Product p) {
        List<ProductBatch> batches = batchRepository.findByProductIdOrderByExpirationDateAsc(p.getId());
        LocalDate today = LocalDate.now();

        int total = 0;
        int nearExpiry = 0;
        LocalDate closest = null;

        for(ProductBatch b : batches) {
            long days = ChronoUnit.DAYS.between(today, b.getExpirationDate());

            // Daca lotul este expirat (zile < 0), il ignoram si nu adaugam la stoc
            if (days < 0) {
                continue;
            }

            total += b.getQuantity();

            // Daca expira in 7 zile sau mai putin
            if(days >= 0 && days <= 7) {
                nearExpiry += b.getQuantity();
            }

            // Cautam data celui mai urgent lot
            if(closest == null || b.getExpirationDate().isBefore(closest)) {
                closest = b.getExpirationDate();
            }
        }

        p.setStockQuantity(total);
        p.setNearExpiryQuantity(nearExpiry);
        p.setExpirationDate(closest);
    }

    // 2. CONSUMAREA STOCULUI LA CUMPARARE
    public void consumeProductStock(Product product, int qtyToBuy, boolean isFreshRow) {
        List<ProductBatch> batches = batchRepository.findByProductIdOrderByExpirationDateAsc(product.getId());
        LocalDate today = LocalDate.now();
        int remainingToDeduct = qtyToBuy;

        //Pasul 1 Incercam sa deducem din loturile corecte (Fresh sau Clearance)
        for (ProductBatch b : batches) {
            if (remainingToDeduct <= 0) break;
            if (b.getQuantity() <= 0) continue; // ignoram loturile deja goale

            long days = ChronoUnit.DAYS.between(today, b.getExpirationDate());
            boolean isThisBatchClearance = (days >= 0 && days <= 7);

            //Filtra daca vrea Fresh, ignoram loturile de Clearance. Invers e la fel.
            if (isFreshRow && isThisBatchClearance) continue;
            if (!isFreshRow && !isThisBatchClearance) continue;

            if (b.getQuantity() >= remainingToDeduct) {
                b.setQuantity(b.getQuantity() - remainingToDeduct);
                remainingToDeduct = 0;
            } else {
                remainingToDeduct -= b.getQuantity();
                b.setQuantity(0);
            }
            batchRepository.save(b);
        }

        //Pasul 2 (FALLBACK DE SIGURANTA):
        //Daca din greseala de rotunjire a zilelor mai a ramas cantitate de dedus.
        //dar produsul MAI ARE fizic stoc in alte loturi, nu blocam comanda, deducem din ce a mai ramas (prioritizand loturile cele mai vechi).
        if (remainingToDeduct > 0) {
            for (ProductBatch b : batches) {
                if (remainingToDeduct <= 0) break;
                if (b.getQuantity() <= 0) continue;

                if (b.getQuantity() >= remainingToDeduct) {
                    b.setQuantity(b.getQuantity() - remainingToDeduct);
                    remainingToDeduct = 0;
                } else {
                    remainingToDeduct -= b.getQuantity();
                    b.setQuantity(0);
                }
                batchRepository.save(b);
            }
        }

        // Daca abia ACUM a ramas mai mult decat stocul fizic global, aruncam eroare.
        if (remainingToDeduct > 0) {
            throw new RuntimeException("Critical Error: Not enough stock for " + product.getName() + ". Please update your cart.");
        }

        syncProductAggregates(product);
        productRepository.save(product);
    }

    // ==========================================
    // 3. CRON JOB
    // ==========================================
    @Scheduled(cron = "0 0 0 * * *")
    @EventListener(ApplicationReadyEvent.class)
    public void autoManageLotsAndExpirations() {
        log.info("Rulare algoritm automat de gestionare loturi si expirari...");

        List<ProductBatch> allBatches = batchRepository.findAll();
        LocalDate today = LocalDate.now();
        int expiredCount = 0;

        // Stergem fizic loturile expirate (au trecut de ziua de azi)
        for(ProductBatch b : allBatches) {
            if(b.getExpirationDate().isBefore(today)) {
                batchRepository.delete(b);
                expiredCount++;
            }
        }

        // Recalculam sumele pentru toate produsele ca sa se reflecte in sistem
        List<Product> products = productRepository.findAll();
        for(Product p : products) {
            syncProductAggregates(p);
            productRepository.save(p);
        }
        log.info("Cron job finalizat. Loturi expirate scoase din vanzare: " + expiredCount);
    }

    // ==========================================
    // 4. CALCUL PRETURI DTO
    // ==========================================
    private ProductResponseDTO enrichProductDto(Product p) {
        ProductResponseDTO dto = productMapper.toDto(p);
        Discount activeDiscount = findActiveDiscount(p);

        Double freshPrice = p.getPrice();
        if (activeDiscount != null) {
            freshPrice = applyDiscount(p.getPrice(), activeDiscount.getDiscountValue(), activeDiscount.getDiscountType());
        }
        dto.setFreshPrice(Math.round(freshPrice * 100.0) / 100.0);

        Double expiryPrice = p.getPrice();
        boolean hasExpiryDiscount = false;

        if (p.getNearExpiryQuantity() > 0 && p.getExpirationDate() != null) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), p.getExpirationDate());
            if (days <= 3) expiryPrice = p.getPrice() * 0.25;
            else if (days <= 5) expiryPrice = p.getPrice() * 0.55;
            else if (days <= 7) expiryPrice = p.getPrice() * 0.75;
            hasExpiryDiscount = true;
        }

        if (hasExpiryDiscount && expiryPrice < freshPrice) {
            dto.setCurrentPrice(Math.round(expiryPrice * 100.0) / 100.0);
            dto.setHasActiveDiscount(true);
            dto.setDiscountType("PERCENT");
            double totalPercent = ((p.getPrice() - expiryPrice) / p.getPrice()) * 100;
            dto.setDiscountValue(Math.round(totalPercent * 10.0) / 10.0);
        } else if (activeDiscount != null) {
            dto.setCurrentPrice(freshPrice);
            dto.setHasActiveDiscount(true);
            dto.setDiscountValue(activeDiscount.getDiscountValue());
            dto.setDiscountType(activeDiscount.getDiscountType());
        } else {
            dto.setCurrentPrice(p.getPrice());
            dto.setHasActiveDiscount(false);
        }

        return dto;
    }

    public Double calculateSubtotalForQuantity(Product product, Integer requestedQty, boolean forceFreshPrice) {
        if (product.getStockQuantity() <= 0) return 0.0;
        ProductResponseDTO dto = enrichProductDto(product);
        return requestedQty * (forceFreshPrice ? dto.getFreshPrice() : dto.getCurrentPrice());
    }

    private Double applyDiscount(Double originalPrice, Double value, String type) {
        if (type == null || value == null) return originalPrice;
        String cleanType = type.trim().toUpperCase();
        if (cleanType.contains("PERCENT")) return originalPrice - (originalPrice * value / 100.0);
        else if (cleanType.contains("FIXED")) return Math.max(originalPrice - value, 0.0);
        return originalPrice;
    }

    public Discount findActiveDiscount(Product product) {
        if(product.getDiscounts()==null || product.getDiscounts().isEmpty()) return null;
        Instant now=Instant.now();
        return product.getDiscounts().stream().filter(d ->
                d.getDiscountStartDate().isBefore(now)&&d.getDiscountEndDate().isAfter(now)).findFirst().orElse(null);
    }

    // ==========================================
    // METODE CRUD DE BAZA
    // ==========================================
    @Transactional(readOnly = true)
    public List<ProductResponseDTO> searchProductsByName(String query) {
        return productRepository.searchProductsByNameOrBrand(query).stream().map(this::enrichProductDto).collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getAllProducts() {
        return productRepository.findAll().stream().map(this::enrichProductDto).collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public ProductResponseDTO getProductById(Long id) {
        return productRepository.findById(id).map(this::enrichProductDto).orElseThrow(() -> new RuntimeException("Produsul nu a fost gasit."));
    }
    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getProductsExpiringBefore(LocalDate date) {
        return productRepository.findByExpirationDateBefore(date).stream().map(this::enrichProductDto).collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getProductsByBrandName(String brandName) {
        return productRepository.findByBrandName(brandName).stream().map(this::enrichProductDto).collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getProductsByCategoryName(String categoryName) {
        return productRepository.findByCategoryName(categoryName).stream().map(this::enrichProductDto).collect(Collectors.toList());
    }

    public ProductResponseDTO createProduct(ProductCreationDTO creationDTO) {

        // VALIDARE: Expiration date < 7 zile
        if (creationDTO.getExpirationDate() != null) {
            long days = ChronoUnit.DAYS.between(LocalDate.now(), creationDTO.getExpirationDate());
            if (days < 7) {
                throw new RuntimeException("Cannot create product! Expiration date must be at least 7 days from today.");
            }
        }

        Product productToSave = productMapper.toEntity(creationDTO);
        Brand brand = brandRepository.findById(creationDTO.getBrandId()).orElseThrow();
        Category category = categoryRepository.findById(creationDTO.getCategoryId()).orElseThrow();

        productToSave.setBrand(brand);
        productToSave.setCategory(category);

        // Initializam stock-urile la 0 pentru a le recalcula corect prin syncProductAggregates
        productToSave.setStockQuantity(0);
        productToSave.setNearExpiryQuantity(0);
        productToSave = productRepository.save(productToSave);

        // Cream primul lot pe baza datelor venite
        if (creationDTO.getStockQuantity() != null && creationDTO.getStockQuantity() > 0) {
            ProductBatch initialBatch = new ProductBatch();
            initialBatch.setProduct(productToSave);
            initialBatch.setQuantity(creationDTO.getStockQuantity());
            initialBatch.setExpirationDate(creationDTO.getExpirationDate() != null ? creationDTO.getExpirationDate() : LocalDate.now().plusYears(10));
            batchRepository.save(initialBatch);
        }

        if (creationDTO.getImageUrls() != null) {
            Set<ProductImage> images = new HashSet<>();
            for (String url : creationDTO.getImageUrls()) {
                ProductImage img = new ProductImage();
                img.setImageUrl(url);
                img.setProduct(productToSave);
                images.add(img);
            }
            productToSave.setImages(images);
        }
        if (creationDTO.getAttributes() != null) {
            List<ProductAttribute> attrs = new java.util.ArrayList<>();
            Product finalProductToSave = productToSave;
            creationDTO.getAttributes().forEach((key, value) -> {
                ProductAttribute attr = new ProductAttribute();
                attr.setName(key);
                attr.setValue(value);
                attr.setProduct(finalProductToSave);
                attrs.add(attr);
            });
            productToSave.setAttributes(attrs);
        }

        syncProductAggregates(productToSave);
        return enrichProductDto(productRepository.save(productToSave));
    }

    public ProductResponseDTO updateProduct(Long id, ProductCreationDTO updateDTO) {
        Product existingProduct = productRepository.findById(id).orElseThrow();
        existingProduct.setName(updateDTO.getName());
        existingProduct.setPrice(updateDTO.getPrice());
        existingProduct.setUnitOfMeasure(updateDTO.getUnitOfMeasure());

        Brand brand = brandRepository.findById(updateDTO.getBrandId()).orElseThrow();
        Category category = categoryRepository.findById(updateDTO.getCategoryId()).orElseThrow();
        existingProduct.setBrand(brand);
        existingProduct.setCategory(category);

        return enrichProductDto(productRepository.save(existingProduct));
    }

    public ProductResponseDTO updateProductPrice(Long id, Double newPrice) {
        Product existingProduct = productRepository.findById(id).orElseThrow();
        existingProduct.setPrice(newPrice);
        return enrichProductDto(productRepository.save(existingProduct));
    }

    public ProductResponseDTO deleteProduct(Long id) {
        Product p = productRepository.findById(id).orElseThrow();
        if (p.getImages() != null && !p.getImages().isEmpty()) {
            for (ProductImage img : p.getImages()) {
                String imageUrl = img.getImageUrl();
                if (imageUrl != null && imageUrl.startsWith("/products/")) {
                    try {
                        Path filePath = Paths.get(UPLOAD_DIR + imageUrl.substring("/products/".length()));
                        Files.deleteIfExists(filePath);
                    } catch (Exception e) {}
                }
            }
        }
        productRepository.delete(p);
        return productMapper.toDto(p);
    }

    // Aruncarea stocului care e in Clearance (Toate loturile <= 7 zile)
    public ProductResponseDTO dropClearanceStock(Long id) {
        Product existingProduct = productRepository.findById(id).orElseThrow();
        List<ProductBatch> batches = batchRepository.findByProductIdOrderByExpirationDateAsc(id);
        LocalDate today = LocalDate.now();

        for (ProductBatch b : batches) {
            long days = ChronoUnit.DAYS.between(today, b.getExpirationDate());
            if (days >= 0 && days <= 7) {
                batchRepository.delete(b);
            }
        }

        syncProductAggregates(existingProduct);
        return enrichProductDto(productRepository.save(existingProduct));
    }

    // METODA NOUA PENTRU LOTURI
    public ProductResponseDTO addNewBatch(Long id, Integer incomingStock, LocalDate expirationDate) {
        if (expirationDate != null) {
            long daysUntilExpiration = ChronoUnit.DAYS.between(LocalDate.now(), expirationDate);
            if (daysUntilExpiration < 7) {
                throw new RuntimeException("Cannot add batch! Expiration date must be at least 7 days from today.");
            }
        }

        Product existingProduct = productRepository.findById(id).orElseThrow();

        ProductBatch newBatch = new ProductBatch();
        newBatch.setProduct(existingProduct);
        newBatch.setQuantity(incomingStock);
        newBatch.setExpirationDate(expirationDate != null ? expirationDate : LocalDate.now().plusYears(10));
        batchRepository.save(newBatch);

        syncProductAggregates(existingProduct);
        return enrichProductDto(productRepository.save(existingProduct));
    }
}