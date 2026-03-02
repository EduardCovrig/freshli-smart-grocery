package covrig.eduard.project.dtos.order;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderItemResponseDTO {
    private Long id;
    private Integer quantity;
    private Double price; //pretul la momentul cumpararii, dupa posibile reduceri
    private Double basePrice; //pretul initial, fara reduceri
    //private Long productId; ->
    private String productName;
    private Double subTotal; //price * quantity;
    private String imageUrl;
    private Long productId;

    private String unitOfMeasure;

}
