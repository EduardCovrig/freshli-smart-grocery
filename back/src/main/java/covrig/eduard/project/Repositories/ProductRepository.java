package covrig.eduard.project.Repositories;

import covrig.eduard.project.Models.Product;
import org.springframework.data.jpa.repository.EntityGraph;
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



    //EntityGraph forteaza java sa aduca din prima brand, category, images, discounts dintr-un singur query sql,
    // deci optimizam astfel timpul de raspuns
    //filtrare
    @EntityGraph(attributePaths = {"brand", "category", "images", "discounts"})
    List<Product> findByBrandName(String brand);

    @EntityGraph(attributePaths = {"brand", "category", "images", "discounts"})
    public List<Product> findByCategoryName(String categoryName);

    @EntityGraph(attributePaths = {"brand", "category", "images", "discounts"})
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.brand.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> searchProductsByNameOrBrand(@Param("query") String query);

    @Override
    @EntityGraph(attributePaths = {"brand", "category", "images", "discounts"})
    List<Product> findAll();



}
