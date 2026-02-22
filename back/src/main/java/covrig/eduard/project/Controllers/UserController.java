package covrig.eduard.project.Controllers;

import covrig.eduard.project.Services.UserService;
import covrig.eduard.project.dtos.user.UserProfileUpdateDTO;
import covrig.eduard.project.dtos.user.UserResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin("*")
@RequiredArgsConstructor

public class UserController {
    private final UserService userService;

    // GET /api/users/me (Profilul meu)
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(userService.getProfile(authentication.getName()));
    }

    // PUT /api/users/me (Actualizare profil)
    @PutMapping("/me")
    public ResponseEntity<UserResponseDTO> updateMyProfile(Authentication authentication, @RequestBody @Valid UserProfileUpdateDTO dto) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), dto));
    }
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMyProfile(@RequestBody Map<String, String> payload, Authentication authentication) {
        String providedPassword = payload.get("password");

        if (providedPassword == null || providedPassword.isBlank()) {
            return ResponseEntity.badRequest().body("Parola este obligatorie.");
        }

        boolean isDeleted = userService.verifyAndDelete(authentication.getName(), providedPassword);

        if (isDeleted) {
            return ResponseEntity.noContent().build();
        } else {
            // Trimitem 401 daca parola e gresita
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Parola incorecta.");
        }
    }
}
