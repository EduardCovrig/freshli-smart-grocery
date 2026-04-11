package covrig.eduard.project.Services;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Async //se trimite in fundal fara se se blocheze
    public void sendHtmlEmail(String to, String subject, String htmlBody)
    {
        try
        {
            MimeMessage message = mailSender.createMimeMessage();
            //Folosim true pentru a indica faptul ca este un mesaj multipart
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Freshli Store");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // TRUE inseamna HTML, nu text normal

            mailSender.send(message);
            System.out.println("Successfully sent HTML Mail to "+ to);
        }
        catch(Exception e)
        {
            System.out.println("Error sending HTML mail: " + e.getMessage());
        }
    }
    // Template HTML (se aplica la toate mailurile)
    public String buildHtmlTemplate(String title, String content) {
        return """
               <!DOCTYPE html>
               <html>
               <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 30px 10px; margin: 0;">
                   <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(19, 76, 156, 0.1);">
                       <div style="background-color: #134c9c; padding: 25px; text-align: center;">
                           <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">
                               Freshli<span style="color: #80c4e8;">.</span>
                           </h1>
                       </div>
                       
                       <div style="padding: 40px 30px; color: #334155; line-height: 1.6; font-size: 16px;">
                           <h2 style="color: #0f3d7d; margin-top: 0; font-size: 22px; font-weight: 800;">%s</h2>
                           %s
                       </div>
                       
                       <div style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
                           Smarter choices. Better prices.<br><br>
                           &copy; 2026 Freshli Store. All rights reserved.
                       </div>
                   </div>
               </body>
               </html>
               """.formatted(title, content);
    }
}

