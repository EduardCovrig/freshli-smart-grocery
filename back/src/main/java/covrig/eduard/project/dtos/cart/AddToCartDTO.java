package covrig.eduard.project.dtos.cart;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddToCartDTO {

    @NotNull(message="Id-ul produsului este obligatoriu")
    private Long productId;

    private Integer quantity;

    private Boolean freshMode = false;
}
