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

    // --- COLOANELE DE STOC (Vor fi actualizate automat de Service) ---
    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @Column(name = "near_expiry_quantity", nullable = false)
    private Integer nearExpiryQuantity = 0;

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



}