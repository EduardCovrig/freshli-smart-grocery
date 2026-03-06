package covrig.eduard.project.mappers;

import covrig.eduard.project.Models.Discount;
import covrig.eduard.project.dtos.discount.DiscountResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "Spring")
public interface DiscountMapper {
    @Mapping(source = "discountValue", target = "percentage")
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "product.price", target = "basePrice")
    // Logica pentru imagine (daca are imagini, ia prima, altfel null)
    @Mapping(target = "productImage", expression = "java(" +
            "discount.getProduct().getImages() != null && !discount.getProduct().getImages().isEmpty() ? " +
            "discount.getProduct().getImages().get(0).getImageUrl() " +
            ": null)")
    // Logica pentru calculul pretului redus (doar pt procent)
    @Mapping(target = "reducedPrice", expression = "java(" +
            "discount.getDiscountType().equalsIgnoreCase(\"PERCENT\") ? " +
            "discount.getProduct().getPrice() - (discount.getProduct().getPrice() * discount.getDiscountValue() / 100) " +
            ": Math.max(0, discount.getProduct().getPrice() - discount.getDiscountValue()))")
    DiscountResponseDTO toDto(Discount discount);
    List<DiscountResponseDTO> toDtoList(List<Discount> discountList);

}
