package covrig.eduard.project.dtos.order;

import covrig.eduard.project.Models.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponseDTO {
    private Long id;
    private Instant createdAt;
    private String status;
    private Double totalPrice;
    private Long userId;
    private List<OrderItemResponseDTO> items; //va cauta in OrderMapper o metoda care transforma OrderItem in OrderItemResponseDTO,
    // si o va aplica recursiv pe toata lista

    //detalii client (vor fi nevoie de ele pentru generare factura)
    private String userEmail;
    private String userFullName;
}
