package covrig.eduard.project.Controllers;

import covrig.eduard.project.Models.User;
import covrig.eduard.project.Repositories.UserRepository;
import covrig.eduard.project.Services.EmailService;
import covrig.eduard.project.Services.NotificationService;
import covrig.eduard.project.dtos.notification.NotificationDTO;
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
        String message = payload.get("message").toString();

        notificationService.sendPromoNotification(targetUserId, message);
        User targetUser = userRepository.findById(targetUserId).orElseThrow();
        emailService.sendEmail(
                targetUser.getEmail(),
                "A special gift for you from Freshli!",
                "Hi " + targetUser.getFirstName() + ",\n\n" + message + "\n\nSee you soon,\nThe Freshli Team"
        );
        return ResponseEntity.ok(message);
    }

    //3. Clientul da click pe notificare -> devine citita
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markOneAsRead(Authentication authentication, @PathVariable Long id) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        notificationService.markAsRead(user.getId(), id);
        return ResponseEntity.ok().build();
    }
}
