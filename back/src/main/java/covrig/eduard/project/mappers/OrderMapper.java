package covrig.eduard.project.mappers;

import covrig.eduard.project.Models.CartItem;
import covrig.eduard.project.Models.Order;
import covrig.eduard.project.Models.OrderItem;
import covrig.eduard.project.dtos.order.OrderItemResponseDTO;
import covrig.eduard.project.dtos.order.OrderResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel="spring")
public interface OrderMapper {
    // Order -> DTO
    @Mapping(source = "user.id", target = "userId")
    OrderResponseDTO toDto(Order order);
    // List Order -> List DTO
    List<OrderResponseDTO> toDtoList(List<Order> orders);

    //OrderItem -> DTO
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "product.id", target = "productId")
    @Mapping(target = "subTotal", expression = "java(item.getPrice() * item.getQuantity())")
    @Mapping(source = "product.unitOfMeasure", target = "unitOfMeasure")
    @Mapping(target = "imageUrl", expression = "java(item.getProduct().getImages() != null &&" +
            " !item.getProduct().getImages().isEmpty() ? item.getProduct().getImages().get(0).getImageUrl() : null)")
    OrderItemResponseDTO toItemDto(OrderItem item); //metoda care se va aplica recursiv pe lista de iteme din OrderResponseDTO


    //CartItem -> OrderItem
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(source = "product", target = "product")
    @Mapping(source = "quantity", target = "quantity")
    @Mapping(source = "product.price", target = "basePrice")
    @Mapping(target = "price", ignore = true)
    OrderItem cartItemToOrderItem(CartItem cartItem);
}
