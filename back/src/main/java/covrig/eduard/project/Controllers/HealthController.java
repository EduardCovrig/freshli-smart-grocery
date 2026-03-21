package covrig.eduard.project.Controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin("*")
@RequestMapping("/api/health")
public class HealthController {
    //endpoint special pentru cron-job ca sa tina serverul deployed treaz
    @GetMapping("/ping")
    public ResponseEntity<String> pingServer()
    {
        return ResponseEntity.ok("Java is awake!");
    }
}
