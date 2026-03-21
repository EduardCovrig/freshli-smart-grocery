package covrig.eduard.project.mappers;

import covrig.eduard.project.Models.Cart;
import covrig.eduard.project.Models.CartItem;
import covrig.eduard.project.Models.Product;
import covrig.eduard.project.Models.ProductAttribute;
import covrig.eduard.project.Services.ProductService;
import covrig.eduard.project.dtos.cart.CartItemResponseDTO;
import covrig.eduard.project.dtos.cart.CartResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = "spring")
public abstract class CartMapper {
    @Autowired
    protected ProductService productService; //injectat pentru calculul dinamic
    // Mapare cart -> dto
    @Mapping(source="user.id",target = "userId") //(userId=cart.getUser()).getId(), iar userId este in CartResponseDTO
    @Mapping(target = "totalPrice", expression = "java(calculateTotalPrice(cart))")
    public abstract CartResponseDTO toDto(Cart cart);


    //Mapare CartItem -> dto
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "product.unitOfMeasure", target = "productUnit")
    // Mapam prețul mediu per unitate (poate fi mixt daca lotul redus nu acopera toata cantitatea)
    @Mapping(target = "pricePerUnit", expression = "java(calculateEffectivePrice(item))")
    //calcul subtotal folosind logica de loturi FIFO
    @Mapping(target = "subTotal", expression = "java(calculateSubTotal(item))")
    @Mapping(target = "imageUrl", expression = "java(mapMainImage(item.getProduct()))")
    @Mapping(source = "product.brand.name", target = "brandName")
    @Mapping(target = "calories", expression = "java(getCalories(item.getProduct()))")
    @Mapping(source = "product.nearExpiryQuantity", target = "nearExpiryQuantity")
    @Mapping(source = "product.stockQuantity", target = "stockQuantity") //stoc global
    @Mapping(source = "isFreshSelected", target = "freshMode")
    @Mapping(source = "product.price", target = "basePrice")
   public abstract CartItemResponseDTO toItemDto(CartItem item);
    //metoda asta se foloseste automat de catre spring in toDto de mai sus ca sa transforme fiecare cartItem in CartItemResponseDTO
    //pentru lista de iteme ( spring cauta automat o metoda in mapper de forma "CartItemresponse DTO ... (CartItem ...)"






    //-- metodele pentru calculele din expresii --

    public String mapMainImage(Product product) {
        if (product == null || product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }
        return product.getImages().iterator().next().getImageUrl();
    }

    public Double calculateSubTotal(CartItem item) {
        if (item.getProduct() == null) return 0d;
        return productService.calculateSubtotalForQuantity(item.getProduct(), item.getQuantity(),
                Boolean.TRUE.equals(item.getIsFreshSelected())); //daca true e egal cu ce e in paranteza, asa ne asiguram sa nu fie null niciodata
    }

    protected Double calculateEffectivePrice(CartItem item) {
        if (item.getProduct() == null || item.getQuantity() == 0) return 0.0;
        return calculateSubTotal(item) / item.getQuantity();
    }

    public Double calculateTotalPrice(Cart cart) {
        if (cart.getItems() == null) return 0d;
        return cart.getItems().stream()
                .mapToDouble(this::calculateSubTotal)
                .sum();
    }

    public String getCalories(Product product) {
        if (product == null || product.getAttributes() == null) return null;

        List<String> calorieKeys = List.of("calorii", "calories", "kcal", "valoare energetica", "valoare_energetica", "energy", "cal");

        return product.getAttributes().stream()
                .filter(attr -> calorieKeys.contains(attr.getName().toLowerCase())) //daca e in lista
                .map(ProductAttribute::getValue)
                .findFirst()
                .orElse(null);
    }
}
