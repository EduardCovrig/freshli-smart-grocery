package covrig.eduard.project.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Async //se trimite in fundal fara se se blocheze
    public void sendEmail(String to, String subject, String body)
    {
        try
        {
            SimpleMailMessage mailMessage=new SimpleMailMessage();
            mailMessage.setFrom("Freshli Store <" + fromEmail + ">");
            mailMessage.setTo(to);
            mailMessage.setSubject(subject);
            mailMessage.setText(body);
            mailSender.send(mailMessage);
            System.out.println("Successfully sent mail to "+ to);
        }
        catch(Exception e)
        {
            System.out.println("Error sending SMTP mail: " + e.getMessage());
        }
    }
}
