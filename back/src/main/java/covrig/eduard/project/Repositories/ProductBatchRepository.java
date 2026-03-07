package covrig.eduard.project.Repositories;

import covrig.eduard.project.Models.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductBatchRepository extends JpaRepository<ProductBatch,Long> {
    List<ProductBatch> findByProductIdAndIsExpiredFalseOrderByExpirationDateAsc(Long productId);
    List<ProductBatch> findByIsExpiredFalse();
}
