package covrig.eduard.project.Security;


import covrig.eduard.project.Models.User;
import covrig.eduard.project.Repositories.UserRepository;
import covrig.eduard.project.Services.EmailService;
import covrig.eduard.project.Services.NotificationService;
import covrig.eduard.project.Services.UserService;
import covrig.eduard.project.dtos.auth.AuthenticationRequest;
import covrig.eduard.project.dtos.auth.AuthenticationResponse;
import covrig.eduard.project.dtos.user.UserRegistrationDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.management.Notification;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserService userService; //pentru a refolosi logica de creare user, atat.
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public AuthenticationService(UserRepository userRepository, JwtService jwtService, AuthenticationManager authenticationManager, UserService userService, NotificationService notificationService, EmailService emailService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    //1. METODA DE REGISTER (CREEAZA USER-UL SI RETURNEAZA TOKEN-UL ACESTUIA)
    public AuthenticationResponse register(UserRegistrationDTO req)
    {
        userService.createUser(req); //salvam user-ul in baza de date.
        var user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(); //gasim user-ul creat in baza de date.
        //realistic, nu os a intre niciodata pe orelsethrow ca nu are de ce, user-ul abia fiind creat, deci nu are rost
        //sa punem o exceptie custom, totusi, daca chiar intra, va fi prinsa de runtimeexception si va returna ceva generic
        //dar nu se va intampla abasolut niciodat asta.

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("firstName", user.getFirstName());
        extraClaims.put("lastName", user.getLastName());
        extraClaims.put("role", user.getRole().name());
        var jwtToken = jwtService.generateToken(extraClaims, user); //ii generam token jwt cu extra date in el
        String body = "<p>Hi <strong>" + user.getFirstName() + "</strong>,</p>" +
                "<p>Welcome to Freshli! Start shopping for fresh groceries today.</p>" +
                "<div style=\"background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #22c55e; padding: 15px; margin: 25px 0; border-radius: 8px;\">" +
                "🎁 Use code <strong style=\"color: #16a34a; font-size: 18px;\">LICENTA10</strong> for <strong>10% OFF</strong> on your first order!" +
                "</div>" +
                "<p>Happy shopping!</p>";

        String htmlMessage = emailService.buildHtmlTemplate("Welcome to the Freshli Family! 🎉", body);
        emailService.sendHtmlEmail(user.getEmail(), "Welcome to Freshli!", htmlMessage);

        return new AuthenticationResponse(jwtToken); //returnam tokenul.
    }

    // 2. METODA DE LOGIN (VERIFICA PAROLA SI RETURNEAZA TOKEN-UL)
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
       //verifica email-ul si parola criptata
       //daca parola e gresita, arunca exceptie 403 Forbidden automat.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Dacă am ajuns aici, userul e valid. Il cautam si ii dam token-ul.
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found")); //mi-l cauta im baza de date
        //daca nu il gaseste, arunca exceptie

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("firstName", user.getFirstName());
        extraClaims.put("lastName", user.getLastName());
        extraClaims.put("role", user.getRole().name());
        var jwtToken = jwtService.generateToken(extraClaims, user); //ii generam tokenul cu date suplimentare in el

        return new AuthenticationResponse(jwtToken); //il returnam, nu il stocam nicaieri
        //mai departe, e treaba frontend-ului sa il gestioneze pentru vitioarele cereri
    }


    //RESET PASSWORD


    // 1. Trimite link-ul pe mail
    public void sendPasswordResetLink(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            // Generam un JWT token special pentru acest user
            Map<String, Object> claims = new HashMap<>();
            claims.put("purpose", "password_reset");
            claims.put("secret", user.getPasswordHash()); //cand se schimba parola, tokenul va deveni automat invalid.
            String resetToken = jwtService.generateToken(claims, user);


            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            String body = "<p>Hi <strong>" + user.getFirstName() + "</strong>,</p>" +
                    "<p>We received a request to reset your password for your Freshli account. Click the button below to set a new password:</p>" +
                    "<div style=\"text-align: center; margin: 35px 0;\">" +
                    "<a href=\"" + resetLink + "\" style=\"background-color: #134c9c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;\">Reset My Password</a>" +
                    "</div>" +
                    "<p>If you didn't request a password reset, you can safely ignore this email.</p>";

            String htmlMessage = emailService.buildHtmlTemplate("Password Reset Request 🔒", body);
            emailService.sendHtmlEmail(user.getEmail(), "Freshli - Reset Your Password", htmlMessage);
        }
    }

    // 2. Validează token-ul din link și schimbă parola
    public void resetPasswordWithToken(String token, String newPassword) {
        String email = jwtService.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid token or user not found."));

        if (!jwtService.isTokenValid(token, user)) { //verificare generala token
            throw new RuntimeException("Your reset link has expired or is invalid.");
        }
        //validare one-time-use jwt
        String tokenSecret = jwtService.extractClaim(token, claims -> claims.get("secret", String.class));
        if (!user.getPasswordHash().equals(tokenSecret)) { //daca nu mai sunt egale, inseamna ca linkul a fost deja folosit.
            throw new RuntimeException("This password reset link has already been used.");
        }
        //daca se ajunge aici cu succes, schimbam parola
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
