BEGIN;

-- ==========================================
-- 4. USERS (Stereotypes)
-- ==========================================
-- Admin & Test Accounts
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES
(1, NOW(), 'admin@edwc.com', 'Eduard', 'Admin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0700000000', 'ADMIN'),
(2, NOW(), 'eduuardcovrig@gmail.com', 'Eduard', 'Covrig', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i, '0724359507', 'ADMIN'),
(3, NOW(), 'testaccount@gmail.com', 'Mister', 'Test', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0724839383', 'USER');

-- Snack Lovers (101 - 105)
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES
(101, NOW() - INTERVAL '100 days', 'alex.popa@yahoo.com', 'Alexandru', 'Popa', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0722100101', 'USER'),
(102, NOW() - INTERVAL '80 days', 'm.radulescu@gmail.com', 'Mihai', 'Ion', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0722100102', 'USER'),
(103, NOW() - INTERVAL '150 days', 'vlad.matei@gmail.com', 'Vlad', 'Matei', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0722100103', 'USER'),
(104, NOW() - INTERVAL '40 days', 'andrei.stan@yahoo.com', 'Andrei', 'Stan', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0722100104', 'USER'),
(105, NOW() - INTERVAL '10 days', 'c.ionescu@gmail.com', 'Cristian', 'Ionescu', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0722100105', 'USER');

-- Healthy / Vegan (106 - 110)
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES
(106, NOW() - INTERVAL '200 days', 'elena.d@gmail.com', 'Elena', 'Dumitru', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0733100106', 'USER'),
(107, NOW() - INTERVAL '120 days', 'maria.marin@yahoo.com', 'Maria', 'Marin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0733100107', 'USER'),
(108, NOW() - INTERVAL '90 days', 'ioana.stoica@gmail.com', 'Ioana', 'Stoica', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0733100108', 'USER'),
(109, NOW() - INTERVAL '30 days', 'diana.nita@gmail.com', 'Diana', 'Nita', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0733100109', 'USER'),
(110, NOW() - INTERVAL '5 days', 'ana.barbu@yahoo.com', 'Ana', 'Barbu', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0733100110', 'USER');

-- The Baker / Chef (111 - 115)
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES
(111, NOW() - INTERVAL '300 days', 'chef.radu@gmail.com', 'Radu', 'Ilie', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0744100111', 'USER'),
(112, NOW() - INTERVAL '250 days', 'simona.p@yahoo.com', 'Simona', 'Pop', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0744100112', 'USER'),
(113, NOW() - INTERVAL '180 days', 'george.g@gmail.com', 'George', 'Gheorghe', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0744100113', 'USER'),
(114, NOW() - INTERVAL '60 days', 'carmen.t@gmail.com', 'Carmen', 'Toma', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0744100114', 'USER'),
(115, NOW() - INTERVAL '15 days', 'stefan.v@yahoo.com', 'Stefan', 'Vasile', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0744100115', 'USER');

-- Family Shopper (116 - 120)
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES
(116, NOW() - INTERVAL '350 days', 'familia.m@gmail.com', 'Alin', 'Munteanu', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0755100116', 'USER'),
(117, NOW() - INTERVAL '220 days', 'nicoleta.s@yahoo.com', 'Nicoleta', 'Serban', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0755100117', 'USER'),
(118, NOW() - INTERVAL '130 days', 'dan.c@gmail.com', 'Dan', 'Constantin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0755100118', 'USER'),
(119, NOW() - INTERVAL '45 days', 'laura.b@gmail.com', 'Laura', 'Balan', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0755100119', 'USER'),
(120, NOW() - INTERVAL '8 days', 'florin.d@yahoo.com', 'Florin', 'Dobre', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0755100120', 'USER');

-- The Carnivore (121 - 125)
INSERT INTO public.users (id, created_at, email, first_name, last_name, password_hash, phone_number, role) VALUES
(121, NOW() - INTERVAL '160 days', 'm.marian@gmail.com', 'Marian', 'Moldovan', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0766100121', 'USER'),
(122, NOW() - INTERVAL '110 days', 'ionut.c@yahoo.com', 'Ionut', 'Ciobanu', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0766100122', 'USER'),
(123, NOW() - INTERVAL '70 days', 'costin.f@gmail.com', 'Costin', 'Florea', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0766100123', 'USER'),
(124, NOW() - INTERVAL '25 days', 'tiberiu.r@gmail.com', 'Tiberiu', 'Roman', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0766100124', 'USER'),
(125, NOW() - INTERVAL '2 days', 'lucian.m@yahoo.com', 'Lucian', 'Mihai', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TXwhM.i', '0766100125', 'USER');

-- ==========================================
-- 5. ADDRESSES (Sample)
-- ==========================================
INSERT INTO public.address (city, country, is_default_delivery, street, zip_code, user_id) VALUES
('Bucuresti', 'Romania', true, 'Calea Dorobanti 10', '010571', 2),
('Cluj-Napoca', 'Romania', true, 'Str. Memorandumului 15', '400114', 101),
('Timisoara', 'Romania', true, 'Bdul. Vasile Parvan 2', '300223', 106),
('Iasi', 'Romania', true, 'Str. Palat 1', '700032', 111),
('Brasov', 'Romania', true, 'Pta. Unirii 4', '300086', 116),
('Constanta', 'Romania', true, 'Bdul. Tomis 50', '900725', 121);


-- Actualizare secvente
SELECT setval(pg_get_serial_sequence('public.users', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.users;
SELECT setval(pg_get_serial_sequence('public.address', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.address;

COMMIT;