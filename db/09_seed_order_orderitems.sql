BEGIN;

-- ==========================================
-- 12. ORDERS & ORDER ITEMS (Reflecting Stereotypes - Minimum 50 LEI/Order)
-- ==========================================

INSERT INTO public.orders (id, created_at, payment_method, promo_code, status, total_price, user_id) VALUES
-- Snack Lovers (101-105)
(1, NOW() - INTERVAL '28 days', 'CARD', NULL, 'DELIVERED', 54.0, 101),
(2, NOW() - INTERVAL '25 days', 'CASH', NULL, 'DELIVERED', 53.5, 102),
(7, NOW() - INTERVAL '15 days', 'CARD', NULL, 'DELIVERED', 55.5, 103),
(8, NOW() - INTERVAL '12 days', 'CARD', NULL, 'DELIVERED', 55.5, 104),
(17, NOW() - INTERVAL '6 days', 'CASH', NULL, 'DELIVERED', 51.0, 105),
(21, NOW() - INTERVAL '1 days', 'CARD', NULL, 'PROCESSING', 51.0, 101),

-- Healthy / Vegan (106-110)
(3, NOW() - INTERVAL '26 days', 'CARD', NULL, 'DELIVERED', 77.2, 106),
(9, NOW() - INTERVAL '18 days', 'CASH', NULL, 'DELIVERED', 63.5, 109),
(15, NOW() - INTERVAL '8 days', 'CARD', NULL, 'DELIVERED', 114.0, 107),
(18, NOW() - INTERVAL '5 days', 'CASH', NULL, 'DELIVERED', 50.0, 110),
(23, NOW() - INTERVAL '1 days', 'CARD', NULL, 'SHIPPED', 50.0, 108),

-- The Baker / Chef (111-115)
(4, NOW() - INTERVAL '24 days', 'CARD', NULL, 'DELIVERED', 69.0, 111),
(10, NOW() - INTERVAL '16 days', 'CARD', NULL, 'DELIVERED', 74.0, 112),
(16, NOW() - INTERVAL '7 days', 'CASH', NULL, 'DELIVERED', 63.0, 113),
(24, NOW() - INTERVAL '2 hours', 'CARD', NULL, 'CONFIRMED', 65.5, 114),

-- Family Shopper (116-120)
(5, NOW() - INTERVAL '22 days', 'CASH', NULL, 'DELIVERED', 69.5, 116),
(11, NOW() - INTERVAL '14 days', 'CARD', NULL, 'DELIVERED', 77.5, 118),
(14, NOW() - INTERVAL '9 days', 'CARD', NULL, 'DELIVERED', 64.0, 119),
(19, NOW() - INTERVAL '4 days', 'CASH', NULL, 'DELIVERED', 58.0, 120),
(22, NOW() - INTERVAL '1 days', 'CARD', NULL, 'SHIPPED', 100.5, 116),

-- The Carnivore (121-125)
(6, NOW() - INTERVAL '20 days', 'CARD', NULL, 'DELIVERED', 118.0, 121),
(12, NOW() - INTERVAL '11 days', 'CASH', NULL, 'DELIVERED', 60.0, 123),
(13, NOW() - INTERVAL '10 days', 'CARD', 'LICENTA10', 'DELIVERED', 104.4, 124), -- Redus cu 10%
(20, NOW() - INTERVAL '3 days', 'CARD', NULL, 'CANCELLED', 114.0, 125);


-- Inserarea produselor in comenzi (Toate totalizeaza pretul din tabela orders)
INSERT INTO public.order_item (base_price, price, quantity, order_id, product_id) VALUES

-- Order 1 (Snack: Cola, Pringles) = 54.0 LEI
(10.5, 10.5, 2, 1, 137),  -- 2x Cola = 21 lei
(16.5, 16.5, 2, 1, 171),  -- 2x Nutella = 33 lei

-- Order 2 (Snack: Cola Zero, Lays Salt) = 53.5 LEI
(9.5, 9.5, 2, 2, 138),    -- 2x Cola Zero = 19.0 lei
(8.5, 8.5, 3, 2, 155),    -- 3x Lays Sare = 25.5 lei
(9.0, 9.0, 1, 2, 323),    -- 1x Nacho Cheese Tortilla = 9.0 lei

-- Order 3 (Healthy: Water, Bananas, Pistachios) = 77.2 LEI
(3.2, 3.2, 6, 3, 148),    -- 6x Apa Plata = 19.2 lei
(7.0, 7.0, 3, 3, 250),    -- 3kg Banane = 21.0 lei
(18.5, 18.5, 2, 3, 318),  -- 2x Pistachios = 37.0 lei

-- Order 4 (Baker: Flour, Butter) = 69 LEI
(4.5, 4.5, 6, 4, 192),    -- 6x Faina = 27.0 lei
(14.0, 14.0, 3, 4, 187),  -- 3x Unt (presupunem reducere) = 42.0 lei

-- Order 5 (Family: Milk, Pasta, Tomato Pulp) = 69.5 LEI
(8.5, 8.5, 4, 5, 178),    -- 4x Lapte = 34.0 lei
(7.5, 7.5, 3, 5, 189),    -- 3x Paste = 22.5 lei
(6.5, 6.5, 2, 5, 197),    -- 2x Rosii pulpa = 13.0 lei

-- Order 6 (Carnivore: Pork Nape, Sausages) = 118 LEI
(39.0, 39.0, 2, 6, 286),  -- 2kg Ceafa = 78.0 lei
(40.0, 40.0, 1, 6, 294),  -- 1kg Carnati = 40.0 lei

-- Order 7 (Snack: Cola, Milka) = 55.5 LEI
(10.5, 10.5, 3, 7, 137),  -- 3x Cola = 31.5 lei
(6.0, 6.0, 4, 7, 167),    -- 4x Milka Oreo = 24.0 lei

-- Order 8 (Snack: Nachos, Popcorn) = 55.5 LEI
(9.0, 9.0, 4, 8, 323),    -- 4x Nacho Tortilla = 36.0 lei
(6.5, 6.5, 3, 8, 324),    -- 3x Caramel Popcorn = 19.5 lei

-- Order 9 (Healthy: Whole Wheat, Green Tea, Pistachios, Peaches) = 63.5 LEI
(7.0, 7.0, 2, 9, 301),    -- 2x Whole Wheat = 14.0 lei
(9.5, 9.5, 2, 9, 329),    -- 2x Green Tea = 19.0 lei
(18.5, 18.5, 1, 9, 318),  -- 1x Pistachios = 18.5 lei
(12.0, 12.0, 1, 9, 270),  -- 1kg Peaches = 12.0 lei

-- Order 10 (Baker: Pizza Flour, Yeast, Vanilla, Honey) = 74 LEI
(6.5, 6.5, 4, 10, 307),   -- 4x Pizza Flour = 26.0 lei
(1.5, 1.5, 4, 10, 304),   -- 4x Dry Yeast = 6.0 lei
(8.5, 8.5, 2, 10, 306),   -- 2x Vanilla Extract = 17.0 lei
(25.0, 25.0, 1, 10, 222), -- 1x Honey = 25.0 lei

-- Order 11 (Family: Bread, Mini Croissants, Gummy Bears, Cheese) = 77.5 LEI
(5.5, 5.5, 4, 11, 300),   -- 4x White Bread = 22.0 lei
(8.5, 8.5, 2, 11, 316),   -- 2x Mini Croissants = 17.0 lei
(5.5, 5.5, 3, 11, 322),   -- 3x Gummy Bears = 16.5 lei
(22.0, 22.0, 1, 11, 220), -- 1x Cheese = 22.0 lei

-- Order 12 (Carnivore: Burger Buns, Espresso) = 60 LEI
(6.0, 6.0, 3, 12, 303),   -- 3x Burger Buns = 18.0 lei
(42.0, 42.0, 1, 12, 327), -- 1x Espresso Beans = 42.0 lei

-- Order 13 (Carnivore: Beef Ribeye) = 116 LEI (Redus din Promo in tabela Orders la 104.4)
(116.0, 116.0, 1, 13, 288),

-- Order 14 (Family: Minced Meat, Eggs) = 64 LEI
(32.0, 32.0, 1, 14, 285), -- 1kg Minced Meat = 32.0
(32.0, 32.0, 1, 14, 217), -- 1x Eggs L = 32.0

-- Order 15 (Healthy: Salmon) = 114 LEI
(114.0, 114.0, 1, 15, 289),

-- Order 16 (Baker: Eggs, Butter) = 63 LEI
(32.0, 32.0, 1, 16, 217), -- 1x Eggs L = 32.0
(15.5, 15.5, 2, 16, 187), -- 2x Butter = 31.0

-- Order 17 (Snack: Nutella, Bake Rolls) = 51 LEI
(16.5, 16.5, 2, 17, 171), -- 2x Nutella = 33.0
(4.5, 4.5, 4, 17, 164),   -- 4x Bake Rolls = 18.0

-- Order 18 (Healthy: Cherries) = 50 LEI
(25.0, 25.0, 2, 18, 255), -- 2kg Cherries = 50.0

-- Order 19 (Family: Chicken Breast) = 58 LEI
(29.0, 29.0, 2, 19, 282), -- 2kg Chicken Breast = 58.0

-- Order 20 (Carnivore: Salmon) = 114 LEI (CANCELLED)
(114.0, 114.0, 1, 20, 289),

-- Order 21 (Snack: Panettone, Lays Paprika) = 51 LEI (PROCESSING)
(35.0, 35.0, 1, 21, 315), -- 1x Panettone = 35.0
(8.0, 8.0, 2, 21, 156),   -- 2x Lays = 16.0

-- Order 22 (Family: Potatoes, Carrots, Onion, Pork Chop) = 100.5 LEI (SHIPPED)
(3.5, 3.5, 2, 22, 264),   -- 2kg Potatoes = 7.0
(3.0, 3.0, 2, 22, 263),   -- 2kg Carrots = 6.0
(3.5, 3.5, 1, 22, 261),   -- 1kg Onion = 3.5
(42.0, 42.0, 2, 22, 287), -- 2kg Pork Chop = 84.0

-- Order 23 (Healthy: Apples, Pears, Dark Choc, Sparkling Water) = 50 LEI
(6.0, 6.0, 3, 23, 252),   -- 3kg Apples = 18.0
(8.5, 8.5, 2, 23, 253),   -- 2kg Pears = 17.0
(8.0, 8.0, 1, 23, 319),   -- 1x Dark Choc = 8.0
(3.5, 3.5, 2, 23, 144),   -- 2x Water = 7.0

-- Order 24 (Baker: Milk 3.5, Flour, Butter) = 65.5 LEI (CONFIRMED)
(8.5, 8.5, 3, 24, 178),   -- 3x Milk = 25.5
(4.5, 4.5, 2, 24, 192),   -- 2x Flour = 9.0
(15.5, 15.5, 2, 24, 187); -- 2x Butter = 31.0

-- Update Sequence
SELECT setval(pg_get_serial_sequence('public.orders', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.orders;
SELECT setval(pg_get_serial_sequence('public.order_item', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.order_item;

COMMIT;