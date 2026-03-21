package covrig.eduard.project.Services;

import covrig.eduard.project.Models.*;
import covrig.eduard.project.Repositories.*;
import covrig.eduard.project.dtos.order.OrderResponseDTO;
import covrig.eduard.project.dtos.order.PlaceOrderDTO;
import covrig.eduard.project.mappers.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final OrderMapper orderMapper;
    private final ProductService productService;
    private final UserInteractionService interactionService;
    public final NotificationService notificationService;

    public OrderService(OrderRepository orderRepository, CartRepository cartRepository, ProductRepository productRepository, UserRepository userRepository, AddressRepository addressRepository, OrderMapper orderMapper, ProductService productService, UserInteractionService interactionService, NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.orderMapper = orderMapper;
        this.productService = productService;
        this.interactionService = interactionService;
        this.notificationService = notificationService;
    }

    //1. PLACE ORDER
    public OrderResponseDTO placeOrder(String userEmail, PlaceOrderDTO orderDTO)
    {
        User user=userRepository.findByEmail(userEmail).
                orElseThrow(() -> new RuntimeException("Nu exista user-ul cu email-ul " + userEmail));
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Utilizatorul nu are un cos."));
        if (cart.getItems().isEmpty()) {
            throw new RuntimeException("Cosul este gol. Nu poti plasa o comanda.");
        }
        Address address = addressRepository.findById(orderDTO.getAddressId()) //verifica daca are o adresa utilizaotrul
                .orElseThrow(() -> new RuntimeException("Adresa invalida"));

        if (!address.getUser().getId().equals(user.getId())) { //daca adresa nu e a lui (prevenire bug)
            throw new RuntimeException("Aceasta adresa nu iti apartine!");
        }
        //pasul de pregatire comanda
        Order order = new Order();
        //setare date comanda
        order.setUser(user);
        order.setCreatedAt(Instant.now());
        order.setStatus("CONFIRMED");
        try {
            if (orderDTO.getPaymentMethod() != null) {
                // Convertim string-ul din DTO ("CARD") in Enum (PaymentMethod.CARD)
                order.setPaymentMethod(PaymentMethod.valueOf(orderDTO.getPaymentMethod().toUpperCase()));
            } else {
                order.setPaymentMethod(PaymentMethod.CASH);
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Metoda de plata invalida. Foloseste CASH sau CARD.");
        }

        //adaugam produsele din cos in comanda
        order.setItems(new ArrayList<>());
        double totalOrderPrice = 0d;
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            int qtyToBuy = cartItem.getQuantity();
            boolean isFreshRow = Boolean.TRUE.equals(cartItem.getIsFreshSelected());

            // Scade stocul corect direct din loturile (batches) bazei de date!
            productService.consumeProductStock(product, qtyToBuy, isFreshRow);

            // Calculam pretul direct
            Double itemSubtotal = productService.calculateSubtotalForQuantity(product, qtyToBuy, isFreshRow);

            Double effectiveUnitPrice = itemSubtotal / qtyToBuy;
            OrderItem orderItem = orderMapper.cartItemToOrderItem(cartItem);
            orderItem.setOrder(order); orderItem.setPrice(effectiveUnitPrice);
            totalOrderPrice += itemSubtotal; order.getItems().add(orderItem);
            interactionService.logInteraction(user, product, "PURCHASE");
            //pentru fiecare produs, odata ce este pus in comanda, se adauga in tabela user-ului cu interactiuni de cumparare.
        }

        //AICI SE ADAUGA PROMO CODEURI


        if (orderDTO.getPromoCode() != null && !orderDTO.getPromoCode().isBlank()) {
            String code = orderDTO.getPromoCode().toUpperCase().trim();
            if (code.equals("LICENTA10")) { // Exemplu: "LICENTA10" 10% reducere
                totalOrderPrice = totalOrderPrice * 0.90;
                order.setPromoCode(code);
            }
            else if(code.equals(("COMEBACK20-U")+user.getId())) //cod dinamic
            {
                boolean alreadyUsed=orderRepository.findAllByUserId(user.getId()).stream()
                        .anyMatch(pastOrder -> code.equals(pastOrder.getPromoCode()) && !pastOrder.getStatus().equalsIgnoreCase("CANCELLED"));
                if(alreadyUsed)
                    throw new RuntimeException("You already used this promo code!");
                // daca totul e ok:
                totalOrderPrice=totalOrderPrice*0.8;
                order.setPromoCode(code);
            }
            else throw new RuntimeException("Invalid promotional code, or this code is not yours!");

        }
        order.setTotalPrice(totalOrderPrice);
        Order savedOrder = orderRepository.save(order); //salvam comanda in baza de date, savedOrder va avea si id-ul din baza de date preluat
        cart.getItems().clear(); cartRepository.save(cart); //golim cosul
        return orderMapper.toDto(savedOrder); //returnam json cu OrderDto.
    }

    //Pentru Admin - Preluarea tuturor comenzilor din sistem
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getAllOrdersInSystem() {
        // Le sortam descrescator dupa data (cele mai noi primele)
        List<Order> allOrders = orderRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
        );
        return orderMapper.toDtoList(allOrders);
    }

    //Istoric comenzi utilizatof
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getUserOrders(String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElseThrow();
        return orderMapper.toDtoList(orderRepository.findAllByUserId(user.getId()));
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(Long id, String userEmail) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comanda cu ID-ul " + id + " nu a fost gasita."));

        // OWNERSHIP CHECK
        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Nu ai dreptul sa vizualizezi aceasta comanda.");
        }
        return orderMapper.toDto(order);
    }
    public OrderResponseDTO updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Comanda nu a fost gasita."));

        order.setStatus(newStatus.toUpperCase());
        return orderMapper.toDto(orderRepository.save(order));
    }

    //ADMIN
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        Long totalOrders = orderRepository.countTotalOrders();
        Double totalRevenue = orderRepository.sumTotalRevenue();
        Long expiringProducts = productRepository.findAll().stream()
                .filter(p -> p.getNearExpiryQuantity() > 0)
                .count();

        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);
        stats.put("expiringProducts", expiringProducts);

        return stats;
    }

    @Transactional
    public OrderResponseDTO cancelOrder(Long orderId, String userEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Comanda nu a fost gasita."));

        if (!order.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Nu ai dreptul sa anulezi aceasta comanda.");
        }

        if (!order.getStatus().equals("CONFIRMED")) {
            throw new RuntimeException("Comanda nu mai poate fi anulata deoarece este in curs de procesare.");
        }

        order.setStatus("CANCELLED");

        // Restituire automata a stocului
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product != null) {
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }

        return orderMapper.toDto(orderRepository.save(order));
    }

}
