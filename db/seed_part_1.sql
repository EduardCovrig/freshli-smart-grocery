BEGIN;

-- 1. CLEANUP: Stergem tot si resetam ID-urile
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

-- 2. CATEGORIES
INSERT INTO public.category (id, name) VALUES (1, 'Bakery');
INSERT INTO public.category (id, name) VALUES (2, 'Beverages');
INSERT INTO public.category (id, name) VALUES (3, 'Meat & Fish');
INSERT INTO public.category (id, name) VALUES (4, 'Sweets & Snacks');
INSERT INTO public.category (id, name) VALUES (5, 'Fruits & Vegetables');
INSERT INTO public.category (id, name) VALUES (6, 'Dairy & Eggs');
INSERT INTO public.category (id, name) VALUES (7, 'Pastry');

-- 3. BRANDS
INSERT INTO public.brand (id, name) VALUES (21, 'Coca-Cola');
INSERT INTO public.brand (id, name) VALUES (22, 'Pepsi');
INSERT INTO public.brand (id, name) VALUES (23, 'Dorna');
INSERT INTO public.brand (id, name) VALUES (24, 'Borsec');
INSERT INTO public.brand (id, name) VALUES (25, 'Bucovina');
INSERT INTO public.brand (id, name) VALUES (26, 'Aqua Carpatica');
INSERT INTO public.brand (id, name) VALUES (27, 'Lipton');
INSERT INTO public.brand (id, name) VALUES (28, 'Red Bull');
INSERT INTO public.brand (id, name) VALUES (29, 'Lays');
INSERT INTO public.brand (id, name) VALUES (30, 'Pringles');
INSERT INTO public.brand (id, name) VALUES (31, 'Chio');
INSERT INTO public.brand (id, name) VALUES (32, '7Days');
INSERT INTO public.brand (id, name) VALUES (33, 'Bake Rolls');
INSERT INTO public.brand (id, name) VALUES (34, 'Milka');
INSERT INTO public.brand (id, name) VALUES (35, 'Kinder');
INSERT INTO public.brand (id, name) VALUES (36, 'Nutella');
INSERT INTO public.brand (id, name) VALUES (37, 'Mars');
INSERT INTO public.brand (id, name) VALUES (38, 'Snickers');
INSERT INTO public.brand (id, name) VALUES (39, 'Oreo');
INSERT INTO public.brand (id, name) VALUES (40, 'Napolact');
INSERT INTO public.brand (id, name) VALUES (41, 'Zuzu');
INSERT INTO public.brand (id, name) VALUES (42, 'Danone');
INSERT INTO public.brand (id, name) VALUES (43, 'Hochland');
INSERT INTO public.brand (id, name) VALUES (44, 'President');
INSERT INTO public.brand (id, name) VALUES (45, 'Barilla');
INSERT INTO public.brand (id, name) VALUES (46, 'Baneasa');
INSERT INTO public.brand (id, name) VALUES (47, 'Heinz');
INSERT INTO public.brand (id, name) VALUES (48, 'Hellmanns');
INSERT INTO public.brand (id, name) VALUES (49, 'Mutti');
INSERT INTO public.brand (id, name) VALUES (50, 'Local Farmers');

-- 4. USERS
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (3, '2026-02-16 13:16:41.967551 +00:00', 'user3@test.com', 'TestUser3', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000003', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (4, '2026-02-16 13:16:41.967551 +00:00', 'user4@test.com', 'TestUser4', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000004', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (5, '2026-02-16 13:16:41.967551 +00:00', 'user5@test.com', 'TestUser5', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000005', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (6, '2026-02-16 13:16:41.967551 +00:00', 'user6@test.com', 'TestUser6', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000006', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (7, '2026-02-16 13:16:41.967551 +00:00', 'user7@test.com', 'TestUser7', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000007', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (8, '2026-02-16 13:16:41.967551 +00:00', 'user8@test.com', 'TestUser8', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000008', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (9, '2026-02-16 13:16:41.967551 +00:00', 'user9@test.com', 'TestUser9', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000009', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (10, '2026-02-16 13:16:41.967551 +00:00', 'user10@test.com', 'TestUser10', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000010', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (11, '2026-02-16 13:16:41.967551 +00:00', 'user11@test.com', 'TestUser11', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000011', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (12, '2026-02-16 13:16:41.967551 +00:00', 'user12@test.com', 'TestUser12', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000012', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (13, '2026-02-16 13:16:41.967551 +00:00', 'user13@test.com', 'TestUser13', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000013', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (14, '2026-02-16 13:16:41.967551 +00:00', 'user14@test.com', 'TestUser14', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000014', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (15, '2026-02-16 13:16:41.967551 +00:00', 'user15@test.com', 'TestUser15', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000015', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (16, '2026-02-16 13:16:41.967551 +00:00', 'user16@test.com', 'TestUser16', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000016', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (17, '2026-02-16 13:16:41.967551 +00:00', 'user17@test.com', 'TestUser17', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000017', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (18, '2026-02-16 13:16:41.967551 +00:00', 'user18@test.com', 'TestUser18', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000018', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (19, '2026-02-16 13:16:41.967551 +00:00', 'user19@test.com', 'TestUser19', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000019', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (20, '2026-02-16 13:16:41.967551 +00:00', 'user20@test.com', 'TestUser20', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000020', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (27, '2026-02-01 09:20:00.000000 +00:00', 'alexandru.vasile@yahoo.com', 'Alexandru', 'Vasile', '$2a$10$vN9.E.04/oO.u4bL5bM0g.B0hM/1i0s/M9k5wM9eM123456789012', '0766999000', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (28, '2026-02-15 14:10:00.000000 +00:00', 'maria.ionescu@gmail.com', 'Maria', 'Ionescu', '$2a$10$vN9.E.04/oO.u4bL5bM0g.B0hM/1i0s/M9k5wM9eM123456789012', '0777123123', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (300, '2025-10-15 08:00:00.000000 +00:00', 'andrei.popa@gmail.com', 'Andrei', 'Popa', '$2a$10$vN9.E.04/oO.u4bL5bM0g.B0hM/1i0s/M9k5wM9eM123456789012', '0722111222', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (301, '2025-11-02 12:30:00.000000 +00:00', 'elena.dumitrescu@yahoo.com', 'Elena', 'Dumitrescu', '$2a$10$vN9.E.04/oO.u4bL5bM0g.B0hM/1i0s/M9k5wM9eM123456789012', '0733222333', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (302, '2025-12-05 07:15:00.000000 +00:00', 'radu.matei@gmail.com', 'Radu', 'Matei', '$2a$10$vN9.E.04/oO.u4bL5bM0g.B0hM/1i0s/M9k5wM9eM123456789012', '0744555666', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (303, '2026-01-10 16:45:00.000000 +00:00', 'ioana.stan@gmail.com', 'Ioana', 'Stan', '$2a$10$vN9.E.04/oO.u4bL5bM0g.B0hM/1i0s/M9k5wM9eM123456789012', '0755777888', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (304, '2026-02-01 09:20:00.000000 +00:00', 'alexandru.vasile@yahoo.com', 'Alexandru', 'Vasile', '$2a$10$vN9.E.04/oO.u4bL5bM0g.B0hM/1i0s/M9k5wM9eM123456789012', '0766999000', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (305, '2026-02-15 14:10:00.000000 +00:00', 'maria.ionescu@gmail.com', 'Maria', 'Ionescu', '$2a$10$vN9.E.04/oO.u4bL5bM0g.B0hM/1i0s/M9k5wM9eM123456789012', '0777123123', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (306, '2026-03-02 16:16:14.171960 +00:00', 'testaccount@gmail.com', 'mister', 'mister', '$2a$10$MO4GgL.WSMJyHn9GyT0ZduD80VqS50QYW0cgzp5mOkmzTddPwNPUW', '0724839383', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (1, '2025-12-16 13:16:41.945404 +00:00', 'admin@edwc.com', 'Eduard', 'Admin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000000', 'ADMIN');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (2, '2025-12-14 13:16:41.945000 +00:00', 'edwc@gmail.com', 'Eduard', 'Covrig', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0722111333', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (21, '2026-12-16 13:16:41.967000 +00:00', 'user21@test.com', 'TestUser21', 'Smith', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000021', 'USER');
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES (22, '2026-01-03 13:19:40.737974 +00:00', 'eduardcovrig@gmail.com', 'eduard', 'covrig', '$2a$10$2sfBJ/PHQVqgVfVT3oS9..sZyredoqjmqzYPdlsMx.MDWv5Rav5cq', '0724359507', 'ADMIN');

-- 5. ADDRESSES
INSERT INTO public.address (id, city, country, is_default_delivery, street, zip_code, user_id) VALUES (2, 'Bucuresti', 'Romania', true, 'Calea Dorobanti', '028393', 22);
INSERT INTO public.address (id, city, country, is_default_delivery, street, zip_code, user_id) VALUES (3, 'Bucuresti', 'Romania', false, 'Soseaua Alexandria 78', '051537', 22);

-- 6. CARTS
INSERT INTO public.cart (id, updated_at, user_id) VALUES (2, '2026-03-07 11:36:18.876877 +00:00', 22);

-- Actualizare secvente
SELECT setval(pg_get_serial_sequence('public.category', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.category;
SELECT setval(pg_get_serial_sequence('public.brand', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.brand;
SELECT setval(pg_get_serial_sequence('public.users', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.users;
SELECT setval(pg_get_serial_sequence('public.address', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.address;
SELECT setval(pg_get_serial_sequence('public.cart', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.cart;

COMMIT;