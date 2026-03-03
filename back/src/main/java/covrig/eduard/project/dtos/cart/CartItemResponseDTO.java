package covrig.eduard.project.dtos.cart;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CartItemResponseDTO {
    private Long id;            // ID-ul CartItem-ului (PK din tabelul cart_item)
    private Long productId;     // ID-ul produsului (FK catre tabelul product)

    // Date preluate direct din Entitatea Product (pentru afisare in cos)
    private String productName; // Product.name
    private String productUnit; // Product.unitOfMeasure (ex: 'buc', 'kg')
    private Double pricePerUnit; // Product.price (Pretul unei singure bucati)

    private Integer quantity;   // Cantitatea selectata de user
    private Double subTotal;    // Calculat: pricePerUnit * quantity
    private String imageUrl;

    private String brandName;
    private String calories; //se extrage din atribute direct caloriile in mapper cu getCalories()
    private Integer nearExpiryQuantity; //pt interfata cart, sa afisam modal daca cand mareste cantitatea depaseste
    private Integer stockQuantity; //stoc global

    private Boolean freshMode; //fresh sau expira soon
    private Double basePrice;
}
