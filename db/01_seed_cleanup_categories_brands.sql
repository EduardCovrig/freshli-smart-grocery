BEGIN;

-- ==========================================
-- 1. CLEANUP & RESET (Stergem tot si resetam ID-urile)
-- ==========================================
TRUNCATE TABLE public.user_interaction RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.order_item RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.orders RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.cart_item RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.cart RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.address RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.users RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_image RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_attribute RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.discount RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_batch RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.category RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.brand RESTART IDENTITY CASCADE;

-- ==========================================
-- 2. CATEGORIES
-- ==========================================
INSERT INTO public.category (id, name) VALUES
(1, 'Bakery'),
(2, 'Beverages'),
(3, 'Meat & Fish'),
(4, 'Sweets & Snacks'),
(5, 'Fruits & Vegetables'),
(6, 'Dairy & Eggs'),
(7, 'Pastry');

-- ==========================================
-- 3. BRANDS
-- ==========================================
INSERT INTO public.brand (id, name) VALUES
(21, 'Coca-Cola'), (22, 'Pepsi'), (23, 'Dorna'), (24, 'Borsec'),
(25, 'Bucovina'), (26, 'Aqua Carpatica'), (27, 'Lipton'), (28, 'Red Bull'),
(29, 'Lays'), (30, 'Pringles'), (31, 'Chio'), (32, '7Days'),
(33, 'Bake Rolls'), (34, 'Milka'), (35, 'Kinder'), (36, 'Nutella'),
(37, 'Mars'), (38, 'Snickers'), (39, 'Oreo'), (40, 'Napolact'),
(41, 'Zuzu'), (42, 'Danone'), (43, 'Hochland'), (44, 'President'),
(45, 'Barilla'), (46, 'Baneasa'), (47, 'Heinz'), (48, 'Hellmanns'),
(49, 'Mutti'), (50, 'Local Farmers');

-- Actualizare secvente
SELECT setval(pg_get_serial_sequence('public.category', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.category;
SELECT setval(pg_get_serial_sequence('public.brand', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.brand;

COMMIT;