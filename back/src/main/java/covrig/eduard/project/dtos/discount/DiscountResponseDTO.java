package covrig.eduard.project.dtos.discount;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DiscountResponseDTO {
    private Long id;
    private Double percentage; // Din discountValue
    private Long productId;
    private String productName;
    private String productImage;
    private Double basePrice;
    private Double reducedPrice;
}
