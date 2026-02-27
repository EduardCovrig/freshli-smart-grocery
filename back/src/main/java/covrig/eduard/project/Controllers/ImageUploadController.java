package covrig.eduard.project.Controllers;

import covrig.eduard.project.Models.Brand;
import covrig.eduard.project.Repositories.BrandRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;

@RestController
@RequestMapping("/api/products")
@CrossOrigin("*")
public class ImageUploadController {
    private final BrandRepository brandRepository;

    //Calea catre folderul 'public' din front
    private final String UPLOAD_DIR = "../front/public/products/";
    // se considera incepand din working directory, adica din folderul unde e pom.xml
    public ImageUploadController(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("brandId") Long brandId,
            @RequestParam("productName") String productName,
            Authentication authentication) {

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Fișierul este gol.");
            }
            //Extragem numele Brand-ului
            Brand brand = brandRepository.findById(brandId)
                    .orElseThrow(() -> new RuntimeException("Brand-ul nu a fost găsit."));

            //Curatam numele conform regulilor (fara diacritice, spatii -> cratima, litere mici)
            String cleanBrand = sanitizeName(brand.getName());
            String cleanProduct = sanitizeName(productName);

            // Fortam extensia sa fie mereu .jpg, ignorand extensia fisierului incarcat
            String extension = ".jpg";

            //Construim numele final: brand-produs.jpg
            String finalFileName = cleanBrand + "-" + cleanProduct + extension;

            //Salvam fisierul fizic in folderul public.
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs(); // Creeaza folderul daca cumva nu exista
            }
            Path path = Paths.get(UPLOAD_DIR + finalFileName);
            Files.write(path, file.getBytes());

            //  Returnam URL-ul relativ (asa cum il va citi tag-ul <img> din React)
            return ResponseEntity.ok("/products/" + finalFileName);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Eroare la incarcare: " + e.getMessage());
        }
    }

    // curatare text
    private String sanitizeName(String input) {
        if (input == null) return "unknown";

        // 0. EXTRA: Inlocuim '&' cu ' and ' inainte sa stergem caracterele speciale
        // Punem spatii (" and ") ca sa fim siguri ca genereaza cratime (ex: M&M -> m-and-m)
        String withAnd = input.replace("&", " and ");

        // 1. Inlocuieste diacriticele
        String normalized = Normalizer.normalize(withAnd, Normalizer.Form.NFD);
        String withoutDiacritics = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        // 2. Transforma in litere mici
        // 3. Inlocuieste orice nu este litera sau cifra cu o cratima (-)
        // 4. Inlocuieste multiple cratime consecutive cu una singura
        // 5. Taie cratimele ramase accidental la inceput sau sfarsit
        return withoutDiacritics.toLowerCase()
                .replaceAll("[^a-z0-9]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}

