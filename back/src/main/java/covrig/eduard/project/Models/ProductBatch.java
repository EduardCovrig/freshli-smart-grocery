package covrig.eduard.project.Models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "product_batch")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    // True daca cron job-ul l-a scos de la vanzare (a expirat)
    @Column(name = "is_expired", nullable = false)
    private Boolean isExpired = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
}