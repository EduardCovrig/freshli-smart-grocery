package covrig.eduard.project.mappers;

import covrig.eduard.project.Models.Discount;
import covrig.eduard.project.Models.Product;
import covrig.eduard.project.Models.ProductAttribute;
import covrig.eduard.project.Models.ProductImage;
import covrig.eduard.project.dtos.product.ProductCreationDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import covrig.eduard.project.dtos.product.ProductResponseDTO;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Mapper(componentModel="spring")
public interface ProductMapper {
    //MapStruct mapeaza automat campurile cu nume identice ca in tabela
    // (id,name,price,expirationDate,...)

    //facem manual mapping pt campurile cu nume diferite sau relatii.
    //astea doua mapping se aplica doar pt todto (mereu mapping puse se apllica pe prima functie precedata)
    //brand.name il cauta in Product, face .getbrand() si dupa .getname(), si il stocheaza in brandName din ProductResponsedto
    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(target = "imageUrls", source = "images", qualifiedByName = "mapImagesToStrings")
    @Mapping(target = "attributes", source = "attributes", qualifiedByName = "mapAttributesToMap")
    @Mapping(target = "price", source = "price") // 1. Mapam pretul intreg
    @Mapping(target = "currentPrice", source = ".", qualifiedByName = "calculateCurrentPrice") // 2. Calculam matematic pretul redus
    ProductResponseDTO toDto(Product product);

    //pe asta nu e niciun mapping pus
    List<ProductResponseDTO> toDtoList(List<Product> products);
    //functia este facuta in spate de MapStruct


    //CreationDTO
    @Mapping(target = "id", ignore = true) //id-ul este generat automat in bd
    // Le setam manual in Service, trebuie ignorate de MapStruct
    @Mapping(target = "brand", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "images", ignore = true)
    @Mapping(target = "attributes", ignore = true)
    @Mapping(target = "batches", ignore = true) // Ignoram loturile la generarea initiala
    Product toEntity(ProductCreationDTO creationDTO);
    //nu facem list, pt ca la post se face un singur obiect


    //metode ajutatoare

    @Named("mapImagesToStrings")
    default List<String> mapImagesToStrings(List<ProductImage> images) {
        if (images == null) return Collections.emptyList();
        return images.stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());
    }

    @Named("mapAttributesToMap")
    default Map<String, String> mapAttributesToMap(List<ProductAttribute> attributes) {
        if (attributes == null) return Collections.emptyMap();
        return attributes.stream()
                .collect(Collectors.toMap(
                        ProductAttribute::getName,
                        ProductAttribute::getValue,
                        (existing, replacement) -> existing // daca sunt duplicate, pastram primul
                ));
    }
    @Named("calculateCurrentPrice")
    default Double calculateCurrentPrice(Product product) {
        if (product.getPrice() == null) return 0.0;
        Double price = product.getPrice();

        if (product.getDiscounts() != null && !product.getDiscounts().isEmpty()) {
            for (Discount d : product.getDiscounts()) {
                if (d.getDiscountType() != null) {
                    String t = d.getDiscountType().trim().toUpperCase();
                    if (t.contains("PERCENT")) {
                        price = price - (price * d.getDiscountValue() / 100.0);
                    } else if (t.contains("FIXED")) {
                        price = price - d.getDiscountValue();
                    }
                }
            }
        }
        // Rotunjim la 2 zecimale (ex: 8.5 lei redus cu 20% devine 6.8 lei)
        return Math.round(price * 100.0) / 100.0;
    }
}

