package covrig.eduard.project.Services;

import covrig.eduard.project.Models.Product;
import covrig.eduard.project.Models.User;
import covrig.eduard.project.Models.UserInteraction;
import covrig.eduard.project.Repositories.ProductRepository;
import covrig.eduard.project.Repositories.UserInteractionRepository;
import covrig.eduard.project.Repositories.UserRepository;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@AllArgsConstructor
@Transactional
public class UserInteractionService {
    private final UserInteractionRepository userInteractionRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    //metoda veche (necesara doar cand avem DOAR email-ul si ID-ul)
    public void logInteraction(String email, Long productId, String type) {
        User user = userRepository.findByEmail(email).orElse(null);
        Product product = productRepository.findById(productId).orElse(null);
        logInteraction(user, product, type); // o cheama pe cea rapida de jos
    }

    //metoda noua (Foloseste obiectele direct, cu 0 query sql)
    public void logInteraction(User user, Product product, String type) {
        if (user != null && product != null) {
            UserInteraction interaction = new UserInteraction();
            interaction.setUser(user);
            interaction.setInteractionType(type);
            interaction.setProduct(product);
            interaction.setCreatedAt(Instant.now());
            userInteractionRepository.save(interaction);
        }
    }
}
