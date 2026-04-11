BEGIN;

-- ==========================================
-- 11. USER INTERACTIONS (Stereotype Behavior)
-- ==========================================

-- SNACK LOVERS (101 - 105)
-- Produse: 137 (Cola), 138 (Cola Zero), 142 (Pepsi Max), 155 (Lays Sare), 156 (Lays Paprika), 158 (Pringles), 167 (Milka Oreo), 172 (Nutella B-Ready)
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '10 days', 137, 101), ('ADD_TO_CART', NOW() - INTERVAL '10 days', 158, 101), ('VIEW', NOW() - INTERVAL '11 days', 158, 101), ('VIEW', NOW() - INTERVAL '11 days', 167, 101),
('PURCHASE', NOW() - INTERVAL '15 days', 138, 102), ('PURCHASE', NOW() - INTERVAL '15 days', 155, 102), ('ADD_TO_CART', NOW() - INTERVAL '15 days', 172, 102), ('VIEW', NOW() - INTERVAL '16 days', 142, 102),
('PURCHASE', NOW() - INTERVAL '5 days', 137, 103), ('ADD_TO_CART', NOW() - INTERVAL '5 days', 156, 103), ('PURCHASE', NOW() - INTERVAL '5 days', 167, 103), ('VIEW', NOW() - INTERVAL '6 days', 158, 103),
('ADD_TO_CART', NOW() - INTERVAL '2 days', 142, 104), ('PURCHASE', NOW() - INTERVAL '2 days', 158, 104), ('VIEW', NOW() - INTERVAL '2 days', 172, 104),
('PURCHASE', NOW() - INTERVAL '1 days', 137, 105), ('PURCHASE', NOW() - INTERVAL '1 days', 155, 105), ('VIEW', NOW() - INTERVAL '1 days', 156, 105), ('ADD_TO_CART', NOW() - INTERVAL '1 days', 167, 105);

-- HEALTHY / VEGAN (106 - 110)
-- Produse: 148 (Apa Plata), 250 (Banane), 252 (Mere), 257 (Rosii), 259 (Castraveti), 263 (Morcovi), 268 (Salata Verde)
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '20 days', 148, 106), ('PURCHASE', NOW() - INTERVAL '20 days', 250, 106), ('ADD_TO_CART', NOW() - INTERVAL '20 days', 252, 106), ('VIEW', NOW() - INTERVAL '21 days', 257, 106),
('PURCHASE', NOW() - INTERVAL '12 days', 257, 107), ('PURCHASE', NOW() - INTERVAL '12 days', 259, 107), ('ADD_TO_CART', NOW() - INTERVAL '12 days', 268, 107), ('VIEW', NOW() - INTERVAL '13 days', 263, 107),
('PURCHASE', NOW() - INTERVAL '8 days', 148, 108), ('PURCHASE', NOW() - INTERVAL '8 days', 263, 108), ('VIEW', NOW() - INTERVAL '8 days', 250, 108), ('ADD_TO_CART', NOW() - INTERVAL '8 days', 268, 108),
('ADD_TO_CART', NOW() - INTERVAL '3 days', 252, 109), ('PURCHASE', NOW() - INTERVAL '3 days', 259, 109), ('VIEW', NOW() - INTERVAL '4 days', 257, 109),
('PURCHASE', NOW() - INTERVAL '1 days', 250, 110), ('PURCHASE', NOW() - INTERVAL '1 days', 268, 110), ('ADD_TO_CART', NOW() - INTERVAL '1 days', 263, 110), ('VIEW', NOW() - INTERVAL '2 days', 148, 110);

-- THE BAKER / CHEF (111 - 115)
-- Produse: 177 (Lapte), 187 (Unt), 192 (Faina), 216 (Oua 10), 222 (Miere), 224 (Paine Maia)
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '25 days', 192, 111), ('PURCHASE', NOW() - INTERVAL '25 days', 187, 111), ('ADD_TO_CART', NOW() - INTERVAL '25 days', 216, 111), ('VIEW', NOW() - INTERVAL '26 days', 177, 111),
('PURCHASE', NOW() - INTERVAL '18 days', 177, 112), ('PURCHASE', NOW() - INTERVAL '18 days', 192, 112), ('ADD_TO_CART', NOW() - INTERVAL '18 days', 222, 112), ('VIEW', NOW() - INTERVAL '19 days', 187, 112),
('PURCHASE', NOW() - INTERVAL '10 days', 216, 113), ('ADD_TO_CART', NOW() - INTERVAL '10 days', 187, 113), ('VIEW', NOW() - INTERVAL '11 days', 192, 113), ('VIEW', NOW() - INTERVAL '11 days', 224, 113),
('PURCHASE', NOW() - INTERVAL '4 days', 192, 114), ('PURCHASE', NOW() - INTERVAL '4 days', 222, 114), ('ADD_TO_CART', NOW() - INTERVAL '4 days', 177, 114),
('ADD_TO_CART', NOW() - INTERVAL '1 days', 187, 115), ('PURCHASE', NOW() - INTERVAL '1 days', 216, 115), ('VIEW', NOW() - INTERVAL '2 days', 192, 115), ('VIEW', NOW() - INTERVAL '2 days', 224, 115);

-- FAMILY SHOPPER (116 - 120)
-- Produse: 178 (Lapte 3.5), 180 (Telemea), 189 (Paste), 197 (Pulpa Rosii), 217 (Oua 30), 224 (Paine), 282 (Pui), 285 (Carne tocata)
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '30 days', 178, 116), ('PURCHASE', NOW() - INTERVAL '30 days', 189, 116), ('PURCHASE', NOW() - INTERVAL '30 days', 197, 116), ('ADD_TO_CART', NOW() - INTERVAL '30 days', 282, 116), ('VIEW', NOW() - INTERVAL '31 days', 180, 116),
('PURCHASE', NOW() - INTERVAL '22 days', 285, 117), ('PURCHASE', NOW() - INTERVAL '22 days', 224, 117), ('ADD_TO_CART', NOW() - INTERVAL '22 days', 217, 117), ('VIEW', NOW() - INTERVAL '23 days', 178, 117),
('PURCHASE', NOW() - INTERVAL '14 days', 180, 118), ('PURCHASE', NOW() - INTERVAL '14 days', 282, 118), ('ADD_TO_CART', NOW() - INTERVAL '14 days', 189, 118), ('VIEW', NOW() - INTERVAL '15 days', 197, 118),
('PURCHASE', NOW() - INTERVAL '6 days', 217, 119), ('ADD_TO_CART', NOW() - INTERVAL '6 days', 178, 119), ('VIEW', NOW() - INTERVAL '7 days', 285, 119),
('PURCHASE', NOW() - INTERVAL '2 days', 189, 120), ('PURCHASE', NOW() - INTERVAL '2 days', 197, 120), ('PURCHASE', NOW() - INTERVAL '2 days', 282, 120), ('ADD_TO_CART', NOW() - INTERVAL '2 days', 224, 120);

-- THE CARNIVORE (121 - 125)
-- Produse: 195 (Ketchup Picant), 266 (Usturoi), 283 (Pulpe Pui), 286 (Ceafa Porc), 288 (Antricot Vita), 294 (Carnati)
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '35 days', 286, 121), ('PURCHASE', NOW() - INTERVAL '35 days', 294, 121), ('ADD_TO_CART', NOW() - INTERVAL '35 days', 195, 121), ('VIEW', NOW() - INTERVAL '36 days', 288, 121),
('PURCHASE', NOW() - INTERVAL '28 days', 288, 122), ('ADD_TO_CART', NOW() - INTERVAL '28 days', 266, 122), ('VIEW', NOW() - INTERVAL '29 days', 283, 122), ('VIEW', NOW() - INTERVAL '29 days', 286, 122),
('PURCHASE', NOW() - INTERVAL '19 days', 283, 123), ('PURCHASE', NOW() - INTERVAL '19 days', 195, 123), ('ADD_TO_CART', NOW() - INTERVAL '19 days', 294, 123), ('VIEW', NOW() - INTERVAL '20 days', 288, 123),
('ADD_TO_CART', NOW() - INTERVAL '9 days', 286, 124), ('PURCHASE', NOW() - INTERVAL '9 days', 266, 124), ('VIEW', NOW() - INTERVAL '10 days', 294, 124),
('PURCHASE', NOW() - INTERVAL '1 days', 288, 125), ('PURCHASE', NOW() - INTERVAL '1 days', 294, 125), ('ADD_TO_CART', NOW() - INTERVAL '1 days', 195, 125), ('VIEW', NOW() - INTERVAL '2 days', 283, 125);

-- Update Sequence
SELECT setval(pg_get_serial_sequence('public.user_interaction', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.user_interaction;

COMMIT;