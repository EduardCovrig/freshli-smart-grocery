package covrig.eduard.project.Repositories;

import covrig.eduard.project.Models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order,Long> {
    List<Order> findAllByUserId(Long id);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status != 'CANCELLED'")
    Long countTotalOrders();

    @Query("SELECT SUM(o.totalPrice) FROM Order o WHERE o.status != 'CANCELLED'")
    Double sumTotalRevenue();
}
