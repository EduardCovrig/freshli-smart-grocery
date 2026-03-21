package covrig.eduard.project.Repositories;

import covrig.eduard.project.Models.Cart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart,Long> {
    // Spring stie automat sa caute dupa User -> Id
    @EntityGraph(attributePaths = {"items", "items.product"}) //sa aduca automat tot ce enevoie dintr-un singur query
    Optional<Cart> findByUserId(Long userId);

}
