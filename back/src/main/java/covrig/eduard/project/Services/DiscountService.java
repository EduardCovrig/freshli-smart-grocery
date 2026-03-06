package covrig.eduard.project.Services;

import covrig.eduard.project.Models.Discount;
import covrig.eduard.project.Repositories.DiscountRepository;
import covrig.eduard.project.dtos.discount.DiscountResponseDTO;
import covrig.eduard.project.mappers.DiscountMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DiscountService {
    private final DiscountRepository discountRepository;
    private final DiscountMapper discountMapper;

    public DiscountService(DiscountRepository discountRepository, DiscountMapper discountMapper)
    {
        this.discountMapper=discountMapper;
        this.discountRepository=discountRepository;
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
}
