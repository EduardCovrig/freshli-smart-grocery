package covrig.eduard.project.Repositories;

import covrig.eduard.project.Models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
@Repository
public interface ProductRepository extends JpaRepository<Product,Long> {
    public List<Product> findByNameContainingIgnoreCase(String name);

    //gestiunea stocului optima
    public List<Product> findByStockQuantityGreaterThan(Integer quantity);

    //pt preturi dinamice (in functie de data de expirare)
    public List<Product> findByExpirationDateBefore(LocalDate date);

    //filtrare
    public List<Product> findByBrandName(String brand);
    public List<Product> findByCategoryName(String categoryName);
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.brand.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> searchProductsByNameOrBrand(@Param("query") String query);

}
