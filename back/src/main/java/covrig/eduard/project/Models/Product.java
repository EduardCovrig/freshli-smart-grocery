package covrig.eduard.project.Models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "product")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    // Prețul de baza al produsului (Base Price)
    @Column(name = "price", nullable = false)
    private Double price;

    // Unitatea de masura (ex: 'kg', 'buc')
    @Column(name = "unit_of_measure", nullable = false)
    private String unitOfMeasure;

    @Column(name = "description", length = 1000)
    private String description;

    // Relatii
    @ManyToOne(fetch = FetchType.LAZY) //brand_id e foreign key catre primary key din alta tabela
    @JoinColumn(name = "brand_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY) //category_id e foreign key catre primary key din alta tabela
    @JoinColumn(name = "category_id")
    private Category category;


    //primary key-ul id e foreign key pentru tabea productImage
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImage> images;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductAttribute> attributes;

    // 3. Discount-uri (Composition)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch=FetchType.EAGER, orphanRemoval = true)
    private List<Discount> discounts;

    // 4. Interactiuni (Composition - conform SQL ON DELETE CASCADE)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserInteraction> interactions;

    // 5. Cart Items (Daca stergi produsul, dispare din cosurile oamenilor)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> cartItems;

    // 6. Order Items
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems;

    // 7. batch
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductBatch> batches;


    // --- METODE CALCULATE DINAMIC DIN LOTURI ---

    // Calculeaza stocul total adunand toate loturile care NU au expirat
    public Integer getStockQuantity() {
        if (batches == null || batches.isEmpty()) return 0;
        return batches.stream()
                .filter(b -> !Boolean.TRUE.equals(b.getIsExpired()))
                .mapToInt(ProductBatch::getQuantity)
                .sum();
    }

    // Calculeaza stocul la reducere (loturile neexpirate care expira in <= 7 zile)
    public Integer getNearExpiryQuantity() {
        if (batches == null || batches.isEmpty()) return 0;
        LocalDate today = LocalDate.now();
        return batches.stream()
                .filter(b -> !Boolean.TRUE.equals(b.getIsExpired()))
                .filter(b -> {
                    long days = java.time.temporal.ChronoUnit.DAYS.between(today, b.getExpirationDate());
                    return days >= 0 && days <= 7;
                })
                .mapToInt(ProductBatch::getQuantity)
                .sum();
    }

    // Returneaza data celui mai "urgent" lot care nu a expirat inca
    public LocalDate getExpirationDate() {
        if (batches == null || batches.isEmpty()) return null;
        return batches.stream()
                .filter(b -> !Boolean.TRUE.equals(b.getIsExpired()))
                .map(ProductBatch::getExpirationDate)
                .min(LocalDate::compareTo)
                .orElse(null);
    }
}