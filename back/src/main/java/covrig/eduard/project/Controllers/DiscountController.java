package covrig.eduard.project.Controllers;

import covrig.eduard.project.Repositories.DiscountRepository;
import covrig.eduard.project.Services.DiscountService;
import covrig.eduard.project.dtos.discount.DiscountResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/discounts")
public class DiscountController {
    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping
    public ResponseEntity<List<DiscountResponseDTO>> getAllDiscounts()
    {
        return ResponseEntity.ok(discountService.getAllDiscount());
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiscountResponseDTO> updateDiscount(@PathVariable Long id, @RequestParam Double percentage)
    {
        return ResponseEntity.ok(discountService.updateDiscountPercentage(id,percentage));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiscount(@PathVariable Long id)
    {
        discountService.deleteDiscount(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<DiscountResponseDTO> createDiscount(@RequestParam Long productId, @RequestParam Double percentage) {
        return ResponseEntity.status(HttpStatus.CREATED).body(discountService.createDiscount(productId, percentage));
    }

}
