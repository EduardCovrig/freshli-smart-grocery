package covrig.eduard.project.Controllers;

import covrig.eduard.project.Models.User;
import covrig.eduard.project.Repositories.UserRepository;
import covrig.eduard.project.Services.EmailService;
import covrig.eduard.project.Services.NotificationService;
import covrig.eduard.project.dtos.notification.NotificationDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final EmailService emailService;
    @Value("${app.frontend.url}")
    private String frontendUrl;

    public NotificationController(NotificationService notificationService, UserRepository userRepository, EmailService emailService) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // 1.Clientul isi extrage notificarile pentru Clopotel
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getMyNotifications(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(notificationService.getUserNotifications(user.getId()));
    }

    // 2. Adminul apasa butonul si trimite o notificare catre Client
    @PostMapping("/send")
    public ResponseEntity<?> sendNotification(Authentication authentication, @RequestBody Map<String, Object> payload) {
        //Securitate: Doar Adminul are voie sa apeleze ruta asta
        User adminUser = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if (!adminUser.getRole().name().equals("ADMIN")) {
            return ResponseEntity.status(403).body("Doar adminii pot trimite coduri promotionale."); //mesaj de eroare pt api
        }

        Long targetUserId = Long.valueOf(payload.get("userId").toString());
        String customMessage = payload.get("message").toString();
        Integer percentage = Integer.valueOf(payload.get("percentage").toString()); // preluam procentajul

        String promoCode = "COMEBACK" + percentage + "-U" + targetUserId;
        String inAppMessage = "We miss you! Use code " + promoCode + " at checkout for a " + percentage + "% discount on your next order!";

        notificationService.sendPromoNotification(targetUserId, inAppMessage);
        User targetUser = userRepository.findById(targetUserId).orElseThrow();

        String body = "<p>Hi <strong>" + targetUser.getFirstName() + "</strong>,</p>" +
                "<p>" + customMessage + "</p>" +
                "<div style=\"background-color: #fff7ed; border: 1px solid #ffedd5; border-left: 5px solid #f97316; padding: 15px; margin: 25px 0; border-radius: 8px; color: #1f2937;\">" +
                "🎁 We miss you! Use code <strong style=\"color: #ea580c; font-size: 18px;\">" + promoCode + "</strong> at checkout for a <strong>" + percentage + "% discount</strong> on your next order!" +
                "</div>" +
                "<div style=\"text-align: center; margin: 35px 0;\">" +
                "<a href=\"" + frontendUrl + "\" style=\"background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;\">Claim Your Discount</a>" +
                "</div>" +
                "<p>See you soon,<br/><strong>The Freshli Team</strong></p>";

        String htmlMessage = emailService.buildHtmlTemplate("A Special Gift For You! 🎁", body);
        emailService.sendHtmlEmail(targetUser.getEmail(), "We miss you at Freshli", htmlMessage);

        return ResponseEntity.ok("Promo sent");
    }

    //3. Clientul da click pe notificare -> devine citita
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markOneAsRead(Authentication authentication, @PathVariable Long id) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        notificationService.markAsRead(user.getId(), id);
        return ResponseEntity.ok().build();
    }
}
