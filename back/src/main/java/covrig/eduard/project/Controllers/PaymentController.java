package covrig.eduard.project.Controllers;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import covrig.eduard.project.Services.CartService;
import covrig.eduard.project.dtos.cart.CartResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin("*")
public class PaymentController {
    @Value("${stripe.api.key}")
    private String stripeSecretKey;

    private final CartService cartService;
    public PaymentController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping("/create-intent")
    public Map<String, String> createPaymentIntent(@RequestBody Map<String, Object> data, Authentication authentication) throws Exception {
        //injectam cheia
        Stripe.apiKey = stripeSecretKey;

        // 1. Identificam utilizatorul care face cererea
        String userEmail = authentication.getName();

        // 2. Cerem cosul lui din baza de date
        CartResponseDTO userCart = cartService.getCartByUser(userEmail);

        // 3. Calculam totalul EXACT asa cum il stie serverul
        Double backendTotal = userCart.getTotalPrice();

        Double frontendRequestedAmount = Double.valueOf(data.get("amount").toString());
        //verificare de securitate
        if (frontendRequestedAmount < (backendTotal * 0.7)) { //cel mai mare cod de discount posibil 30%.
            throw new Exception("Security Alert: Requested amount is significantly lower than cart value.");
        }
        // Stripe foloseste bani (ex: 100 Lei = 10000 bani)
        long amountInBani = Math.round(frontendRequestedAmount * 100);

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInBani).setCurrency("ron").setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build()
                )
                .build();

        PaymentIntent intent = PaymentIntent.create(params);

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", intent.getClientSecret());

        return response;
    }
}
