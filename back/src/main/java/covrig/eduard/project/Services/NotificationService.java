package covrig.eduard.project.Services;

import covrig.eduard.project.Models.Order;
import covrig.eduard.project.dtos.notification.NotificationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.sql.Array;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class NotificationService {
    // "BAZA DE DATE" IN-MEMORY PENTRU NOTIFICARI
    // Cheia (Long) este ID-ul utilizatorului, Valoarea (List) este lista lui de notificari
    private final Map<Long, List<NotificationDTO>> userNotifications = new ConcurrentHashMap<>();
    private long notificationIdCounter = 1;

    //metoda pt admin
    public void sendPromoNotification(Long userId,String message) {
        userNotifications.putIfAbsent(userId, new ArrayList<>());
        NotificationDTO notification = new NotificationDTO(
                notificationIdCounter++,
                userId,
                message,
                Instant.now(),
                false

        );
        userNotifications.get(userId).add(0, notification); //adaugam pe pozitia 0, sa fie prima.
        log.info("Notificare In-Memory salvata pentru User ID {}: {}", userId, message);
    }

        //Metoda pt Client: isi cere automat notificarile la incarcarea paginii
        public List<NotificationDTO> getUserNotifications(Long userId) {
            return userNotifications.getOrDefault(userId, new ArrayList<>()); //array gol daca nu are.
        }

    //Metoda pt Client: Marcheaza o notificare ca fiind citita
    public void markAsRead(Long userId, Long notificationId) {
        List<NotificationDTO> notifs = userNotifications.get(userId);
        if (notifs != null) {
            for (NotificationDTO n : notifs) {
                if (n.getId().equals(notificationId)) {
                    n.setRead(true);
                    break;
                }
            }
        }
    }
}
