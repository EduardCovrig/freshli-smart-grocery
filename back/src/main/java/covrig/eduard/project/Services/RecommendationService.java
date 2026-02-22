package covrig.eduard.project.Services;

import covrig.eduard.project.Models.User;
import covrig.eduard.project.Repositories.ProductRepository;
import covrig.eduard.project.Repositories.UserRepository;
import covrig.eduard.project.dtos.product.ProductResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RecommendationService {
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    @Value("${ai.service.recommendation-url}")
    private String aiRecommendationUrl;

    //RestTemplate este "browser-ul" intern al lui Java cu care vom accesa Python-ul
    private final RestTemplate restTemplate = new RestTemplate();

    public RecommendationService(ProductRepository productRepository, UserRepository userRepository, ProductService productService) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.productService = productService;
    }

    public List<ProductResponseDTO> getRecommendations(String email) {
        Long userId = 0L; // ID-ul 0 e pentru vizitatorii neautentificati (ca sa fie in concordanta cu scriptul de python care
        //va afisa cele mai populare produse dintre toti userii in cazul sata)
        if (email != null && !email.equals("anonymousUser")) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                userId = user.getId();
            }
        }
        try {
            //1. Apelam microserviciul de machine learning din python
            String pythonApiUrl = aiRecommendationUrl +"/" + userId;
            log.info("Cerem recomandari de la AI pentru user_id: {}", userId);
            //Mapam JSON-ul venit de la Python intr-un map
            Map<String, Object> response = restTemplate.getForObject(pythonApiUrl, Map.class);

            if (response != null && response.containsKey("recommended_ids")) {
                List<Integer> recommendedIdsInt = (List<Integer>) response.get("recommended_ids");
                //2. Extragem efectiv produsele din baza noastra de date folosind ID-urile primite
                List<ProductResponseDTO> recommendedProducts = new ArrayList<>();
                for (Integer id : recommendedIdsInt) {
                    try {
                        // Folosim productService pentru ca el stie sa aplice si logica de Reduceri/Preturi Dinamice!
                        ProductResponseDTO dto = productService.getProductById(id.longValue());
                        if (dto.getStockQuantity() > 0) { //ne asiguram ca e pe stock acum
                            recommendedProducts.add(dto);
                        }
                    } catch (Exception e) {
                        // Ignoram discret daca un ID nu mai exista
                    }
                }
                log.info("AI a recomandat cu succes {} produse.", recommendedProducts.size());
                return recommendedProducts;
            }
        } catch (Exception e) {
            log.error("Eroare la conectarea cu Python AI. Detalii: {}", e.getMessage());
        }
        // 3. Fallback de siguranta (Daca ceva pica, sau ai-ul nu e pornit, nu da exceptie si ma baga pe cealalta metoda)
        return getGlobalTopProducts();
    }

    private List<ProductResponseDTO> getGlobalTopProducts() {
        return productRepository.findAll().stream()
                .filter(p -> p.getStockQuantity() > 0)
                .limit(15)
                .map(p -> productService.getProductById(p.getId()))
                .collect(Collectors.toList());
    }
}