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

-- SNACK LOVERS (101 - 105) -> Primesc Nachos, Popcorn, Croissant, Wafer Bar
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '3 days', 323, 101), ('ADD_TO_CART', NOW() - INTERVAL '3 days', 324, 101), ('VIEW', NOW() - INTERVAL '4 days', 309, 101),
('PURCHASE', NOW() - INTERVAL '5 days', 320, 102), ('VIEW', NOW() - INTERVAL '5 days', 310, 102),
('ADD_TO_CART', NOW() - INTERVAL '2 days', 324, 104), ('PURCHASE', NOW() - INTERVAL '2 days', 323, 104);

-- HEALTHY / VEGAN (106 - 110) -> Primesc Paine Integrala, Fistic, Ciocolata Neagra, Ceai Verde
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '6 days', 301, 106), ('PURCHASE', NOW() - INTERVAL '6 days', 329, 106), ('VIEW', NOW() - INTERVAL '7 days', 318, 106),
('PURCHASE', NOW() - INTERVAL '4 days', 319, 107), ('ADD_TO_CART', NOW() - INTERVAL '4 days', 318, 107),
('PURCHASE', NOW() - INTERVAL '2 days', 301, 109), ('PURCHASE', NOW() - INTERVAL '2 days', 318, 109), ('VIEW', NOW() - INTERVAL '3 days', 329, 109);

-- THE BAKER / CHEF (111 - 115) -> Primesc Faina de Pizza, Drojdie, Esenta de Vanilie
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '10 days', 307, 111), ('PURCHASE', NOW() - INTERVAL '10 days', 304, 111), ('ADD_TO_CART', NOW() - INTERVAL '10 days', 306, 111),
('PURCHASE', NOW() - INTERVAL '5 days', 307, 112), ('PURCHASE', NOW() - INTERVAL '5 days', 304, 112), ('PURCHASE', NOW() - INTERVAL '5 days', 306, 112),
('VIEW', NOW() - INTERVAL '1 days', 307, 115), ('ADD_TO_CART', NOW() - INTERVAL '1 days', 304, 115);

-- FAMILY SHOPPER (116 - 120) -> Primesc Paine Alba, Mini Croissants, Gummy Bears, Cafea Instant
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '8 days', 300, 116), ('PURCHASE', NOW() - INTERVAL '8 days', 316, 116), ('ADD_TO_CART', NOW() - INTERVAL '8 days', 322, 116),
('PURCHASE', NOW() - INTERVAL '3 days', 328, 117), ('VIEW', NOW() - INTERVAL '4 days', 300, 117),
('PURCHASE', NOW() - INTERVAL '1 days', 300, 118), ('PURCHASE', NOW() - INTERVAL '1 days', 316, 118), ('PURCHASE', NOW() - INTERVAL '1 days', 322, 118);

-- THE CARNIVORE (121 - 125) -> Primesc Chifle de Burger (pt carne), Grisine si Cafea Boabe
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '12 days', 303, 121), ('ADD_TO_CART', NOW() - INTERVAL '12 days', 308, 121), ('VIEW', NOW() - INTERVAL '13 days', 327, 121),
('PURCHASE', NOW() - INTERVAL '4 days', 303, 123), ('PURCHASE', NOW() - INTERVAL '4 days', 327, 123), ('ADD_TO_CART', NOW() - INTERVAL '4 days', 308, 123);

-- Cimentare SNACK LOVERS (101-105) -> Le dam spam de VIEW si CART pe noile dulciuri ca sa ii legam puternic de categoria 4
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '1 days', 320, 101), ('ADD_TO_CART', NOW() - INTERVAL '1 days', 321, 101), ('VIEW', NOW() - INTERVAL '1 days', 322, 101),
('PURCHASE', NOW() - INTERVAL '2 days', 317, 102), ('PURCHASE', NOW() - INTERVAL '2 days', 319, 102), ('VIEW', NOW() - INTERVAL '2 days', 326, 102),
('ADD_TO_CART', NOW() - INTERVAL '3 days', 325, 103), ('PURCHASE', NOW() - INTERVAL '3 days', 326, 103), ('VIEW', NOW() - INTERVAL '3 days', 159, 103),
('PURCHASE', NOW() - INTERVAL '1 days', 322, 104), ('PURCHASE', NOW() - INTERVAL '1 days', 323, 104), ('ADD_TO_CART', NOW() - INTERVAL '1 days', 170, 104),
('ADD_TO_CART', NOW() - INTERVAL '5 days', 321, 105), ('VIEW', NOW() - INTERVAL '5 days', 318, 105), ('PURCHASE', NOW() - INTERVAL '5 days', 320, 105);

-- Cimentare HEALTHY / VEGAN (106-110) -> Le dam spam pe fructe si apa
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '2 days', 255, 106), ('ADD_TO_CART', NOW() - INTERVAL '2 days', 270, 106), ('VIEW', NOW() - INTERVAL '2 days', 272, 106),
('PURCHASE', NOW() - INTERVAL '1 days', 273, 107), ('VIEW', NOW() - INTERVAL '1 days', 144, 107), ('VIEW', NOW() - INTERVAL '1 days', 256, 107),
('ADD_TO_CART', NOW() - INTERVAL '4 days', 272, 108), ('PURCHASE', NOW() - INTERVAL '4 days', 256, 108), ('VIEW', NOW() - INTERVAL '4 days', 269, 108);

-- Cimentare THE BAKER (111-115) -> Interactiuni grele pe drojdie, faina, unt, lapte, zahar/miere
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '1 days', 305, 111), ('PURCHASE', NOW() - INTERVAL '1 days', 188, 111), ('ADD_TO_CART', NOW() - INTERVAL '1 days', 178, 111),
('ADD_TO_CART', NOW() - INTERVAL '2 days', 306, 112), ('PURCHASE', NOW() - INTERVAL '2 days', 223, 112), ('VIEW', NOW() - INTERVAL '2 days', 165, 112),
('PURCHASE', NOW() - INTERVAL '3 days', 192, 113), ('PURCHASE', NOW() - INTERVAL '3 days', 304, 113), ('VIEW', NOW() - INTERVAL '3 days', 312, 113);

-- Cimentare THE CARNIVORE (121-125) -> Focus puternic pe carne, burger buns, ketchup
INSERT INTO public.user_interaction (interaction_type, created_at, product_id, user_id) VALUES
('PURCHASE', NOW() - INTERVAL '2 days', 287, 121), ('ADD_TO_CART', NOW() - INTERVAL '2 days', 303, 121), ('PURCHASE', NOW() - INTERVAL '2 days', 195, 121),
('PURCHASE', NOW() - INTERVAL '1 days', 289, 122), ('VIEW', NOW() - INTERVAL '1 days', 290, 122), ('ADD_TO_CART', NOW() - INTERVAL '1 days', 292, 122),
('PURCHASE', NOW() - INTERVAL '3 days', 285, 123), ('PURCHASE', NOW() - INTERVAL '3 days', 194, 123), ('VIEW', NOW() - INTERVAL '3 days', 266, 123);

-- Update Sequence
SELECT setval(pg_get_serial_sequence('public.user_interaction', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.user_interaction;

COMMIT;