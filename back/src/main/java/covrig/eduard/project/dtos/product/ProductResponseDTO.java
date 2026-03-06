package covrig.eduard.project.dtos.product;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponseDTO {
    //FARA ADNOTARI @NOTNULL @NOTBLANK ETC SI ALTE VERIFICARI, DEOARECE DATELE 100% SUNT DEJA VALIDE,
    // DEOARECE DATELE VIN DEJA DIRECT DIN BAZA DE DATE
    private Long id;
    private String name;
    private String description;

    private Double price; //pretul de baza
    private Integer stockQuantity;
    private String unitOfMeasure;
    private LocalDate expirationDate;
    private Integer nearExpiryQuantity;

    private String brandName; //Product.brand.name
    private String categoryName; //Product.category.name

    private Double currentPrice;       // Pretul final dupa aplicarea discountului dinamic
    private Double freshPrice;
    private Double discountValue;      // Valoarea discountului calculat
    private String discountType;       // Tipul (PERCENT, FIXED sau DYNAMIC_AUTO)
    private Boolean hasActiveDiscount; // Flag pentru afisare badge-uri în frontend

    private List<String> imageUrls;       // Ex: "/images/mar.jpg"
    private Map<String, String> attributes; // Ex: {"Calorii": "50"}
}
