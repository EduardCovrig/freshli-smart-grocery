BEGIN;

-- ==========================================
-- 12. ORDERS & ORDER ITEMS (Reflecting Stereotypes)
-- ==========================================

-- COMANDA 1: Snack Lover 1(User 101) - Cumpara Cola si Pringles
INSERT INTO public.orders (id, created_at, payment_method, promo_code, status, total_price, user_id) VALUES
(1, NOW() - INTERVAL '10 days', 'CARD', NULL, 'DELIVERED', 33.0, 101);

INSERT INTO public.order_item (base_price, price, quantity, order_id, product_id) VALUES
(10.5, 10.5, 2, 1, 137),  -- 2x Cola = 21 lei
(12.5, 12.5, 1, 1, 158);  -- 1x Pringles = 12.5 lei

-- COMANDA 2: Snack Lover 2 (User 102) - Cumpara Cola Zero si Lays
INSERT INTO public.orders (id, created_at, payment_method, promo_code, status, total_price, user_id) VALUES
(2, NOW() - INTERVAL '15 days', 'CASH', NULL, 'DELIVERED', 26.5, 102);

INSERT INTO public.order_item (base_price, price, quantity, order_id, product_id) VALUES
(9.5, 9.5, 1, 2, 138),   -- 1x Cola Zero = 9.5 lei
(8.5, 8.5, 2, 2, 155);   -- 2x Lays Sare = 17.0 lei

-- COMANDA 3: Healthy 1 (User 106) - Cumpara Apa Plata si Banane
INSERT INTO public.orders (id, created_at, payment_method, promo_code, status, total_price, user_id) VALUES
(3, NOW() - INTERVAL '20 days', 'CARD', NULL, 'DELIVERED', 23.6, 106);

INSERT INTO public.order_item (base_price, price, quantity, order_id, product_id) VALUES
(3.2, 3.2, 3, 3, 148),   -- 3x Apa Plata = 9.6 lei
(7.0, 7.0, 2, 3, 250);   -- 2kg Banane = 14.0 lei

-- COMANDA 4: Baker 1 (User 111) - Cumpara Faina si Unt
INSERT INTO public.orders (id, created_at, payment_method, promo_code, status, total_price, user_id) VALUES
(4, NOW() - INTERVAL '25 days', 'CARD', NULL, 'DELIVERED', 39.0, 111);

INSERT INTO public.order_item (base_price, price, quantity, order_id, product_id) VALUES
(4.5, 4.5, 4, 4, 192),   -- 4x Faina = 18.0 lei
(10.5, 10.5, 2, 4, 187); -- 2x Unt (presupunem ca l-a luat la o reducere din trecut) = 21.0 lei

-- COMANDA 5: Family 1 (User 116) - Cumpara Lapte, Paste, Rosii
INSERT INTO public.orders (id, created_at, payment_method, promo_code, status, total_price, user_id) VALUES
(5, NOW() - INTERVAL '30 days', 'CASH', NULL, 'DELIVERED', 56.0, 116);

INSERT INTO public.order_item (base_price, price, quantity, order_id, product_id) VALUES
(8.5, 8.5, 4, 5, 178),   -- 4x Lapte = 34.0 lei
(7.5, 7.5, 2, 5, 189),   -- 2x Paste = 15.0 lei
(3.5, 3.5, 2, 5, 197);   -- 2x Rosii pulpa = 7.0 lei

-- COMANDA 6: Carnivore 1 (User 121) - Cumpara Ceafa si Carnati
INSERT INTO public.orders (id, created_at, payment_method, promo_code, status, total_price, user_id) VALUES
(6, NOW() - INTERVAL '35 days', 'CARD', NULL, 'DELIVERED', 118.0, 121);

INSERT INTO public.order_item (base_price, price, quantity, order_id, product_id) VALUES
(39.0, 39.0, 2, 6, 286), -- 2kg Ceafa = 78.0 lei
(40.0, 40.0, 1, 6, 294); -- 1kg Carnati = 40.0 lei

-- O COMANDA RECENTA PENTRU ADMIN DASHBOARD (Processing)
INSERT INTO public.orders (id, created_at, payment_method, promo_code, status, total_price, user_id) VALUES
(7, NOW() - INTERVAL '2 hours', 'CARD', NULL, 'PROCESSING', 46.5, 103); -- Gamer 3

INSERT INTO public.order_item (base_price, price, quantity, order_id, product_id) VALUES
(10.5, 10.5, 1, 7, 137),  -- 1x Cola = 10.5 lei
(6.0, 6.0, 6, 7, 167);    -- 6x Milka = 36.0 lei


-- Update Sequence
SELECT setval(pg_get_serial_sequence('public.orders', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.orders;
SELECT setval(pg_get_serial_sequence('public.order_item', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.order_item;

COMMIT;