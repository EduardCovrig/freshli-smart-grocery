package covrig.eduard.project.Services;

import covrig.eduard.project.Models.Discount;
import covrig.eduard.project.Models.Product;
import covrig.eduard.project.Repositories.DiscountRepository;
import covrig.eduard.project.Repositories.ProductRepository;
import covrig.eduard.project.dtos.discount.DiscountResponseDTO;
import covrig.eduard.project.mappers.DiscountMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional
public class DiscountService {
    private final DiscountRepository discountRepository;
    private final DiscountMapper discountMapper;
    private final ProductRepository productRepository;

    public DiscountService(DiscountRepository discountRepository, DiscountMapper discountMapper, ProductRepository productRepository)
    {
        this.discountMapper=discountMapper;
        this.discountRepository=discountRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<DiscountResponseDTO> getAllDiscount()
    {
        List<Discount> discounts=discountRepository.findAll();
        return discountMapper.toDtoList(discounts);
    }

    public DiscountResponseDTO updateDiscountPercentage(Long id, Double newPercentage) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nu s-a gasit discountul cu ID-ul " + id));

        discount.setDiscountValue(newPercentage);
        discount.setDiscountType("PERCENT");

        return discountMapper.toDto(discountRepository.save(discount));
    }

    public void deleteDiscount(Long id) {
        if (!discountRepository.existsById(id)) {
            throw new RuntimeException("Nu s-a gasit discountul cu ID-ul " + id);
        }
        discountRepository.deleteById(id);
    }

    public DiscountResponseDTO createDiscount(Long productId, Double percentage) { // va fi folosita in modal pe fornt
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produsul nu a fost gasit."));

        // Verificam daca are deja un discount ca sa nu il duplicam
        Discount existingDiscount = discountRepository.findAll().stream()
                .filter(d -> d.getProduct().getId().equals(productId))
                .findFirst().orElse(null);

        if (existingDiscount != null) {
            existingDiscount.setDiscountValue(percentage);
            return discountMapper.toDto(discountRepository.save(existingDiscount));
        }

        Discount discount = new Discount();
        discount.setProduct(product);
        discount.setDiscountValue(percentage);
        discount.setDiscountType("PERCENT");
        discount.setDiscountStartDate(Instant.now());
        discount.setDiscountEndDate(Instant.now().plus(365, ChronoUnit.DAYS)); // Valabil 1 an default
        return discountMapper.toDto(discountRepository.save(discount));
    }
}
