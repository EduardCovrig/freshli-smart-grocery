package covrig.eduard.project.Models;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role; // Ex: "ADMIN", "USER"

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    //RELATII ONE-TO-MANY (PENTRU FUNCTUONALITATE)
    //user e numele campului din tabela address/oder/userInteraction
    // toate relatiile astea one-to-many sunt optionale,
    //sunt puse doar ca sa ne ajute sa preluam datele
    // OBLIGATORII SUNT CELE MANYTOONE DIN CELELATE CLASE

    //PRACTIC, E OBLIGATORIU SA PUN @MANYTOONE ACOLO UNDE AM FOREIGN KEY-UL IN CLASA

    // 1. Adrese
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Address> addresses;

    // 2. Comenzi
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Order> orders;

    // 3. Interactiuni (pentru Recomandari)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<UserInteraction> interactions;

    //4 cart
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Cart cart;


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Transforma Enum-ul ROLE în Autoritate Spring
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email; //metoda folosita de spring pentru a identifica user-ul. dar noi ne logam cu email nu cu username,
        // deci returnam email-ul.
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; //un cont nu poate expira
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; //nici parola nu poate expira
    }

    @Override
    public boolean isEnabled() {
        return true; //contul e activ
    }
}