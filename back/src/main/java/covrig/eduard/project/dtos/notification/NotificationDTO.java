package covrig.eduard.project.dtos.notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDTO {
    private Long id;
    private Long userId;
    private String message;
    private Instant date;
    private boolean read;
}
