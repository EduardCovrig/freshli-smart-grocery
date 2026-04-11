BEGIN;

-- ==========================================
-- 8. PRODUCT ATTRIBUTES
-- ==========================================
INSERT INTO public.product_attribute (name, value, product_id) VALUES
-- Sweets & Snacks
('Calories', '520 kcal', 156), ('Carbs', '50 g', 156), ('Proteins', '6 g', 156), ('Fats', '33 g', 156), -- Paprika Chips
('Calories', '450 kcal', 164), ('Carbs', '60 g', 164), ('Proteins', '14 g', 164), ('Fats', '15 g', 164), -- Bake Rolls
('Calories', '536 kcal', 160), ('Carbs', '53 g', 160), ('Proteins', '6 g', 160), ('Fats', '34 g', 160), -- Salted Chips
('Calories', '555 kcal', 167), ('Carbs', '56 g', 167), ('Proteins', '5.5 g', 167), ('Fats', '34 g', 167), -- Milka Oreo
('Calories', '530 kcal', 169), ('Carbs', '58 g', 169), ('Proteins', '6.6 g', 169), ('Fats', '29 g', 169), -- Classic Milka
('Calories', '520 kcal', 161), ('Carbs', '51 g', 161), ('Proteins', '6 g', 161), ('Fats', '32 g', 161), -- Chio Sour Cream
('Calories', '540 kcal', 166), ('Carbs', '54 g', 166), ('Proteins', '7 g', 166), ('Fats', '32 g', 166), -- Milka Alune
('Calories', '539 kcal', 171), ('Carbs', '57 g', 171), ('Proteins', '6 g', 171), ('Fats', '30 g', 171), -- Nutella
('Calories', '521 kcal', 172), ('Carbs', '60 g', 172), ('Proteins', '7 g', 172), ('Fats', '27 g', 172), -- Nutella B-Ready
('Calories', '480 kcal', 175), ('Carbs', '69 g', 175), ('Proteins', '5 g', 175), ('Fats', '20 g', 175), -- Oreo
('Calories', '522 kcal', 158), ('Carbs', '51 g', 158), ('Proteins', '4 g', 158), ('Fats', '33 g', 158), -- Pringles
('Calories', '552 kcal', 170), ('Carbs', '52 g', 170), ('Proteins', '8 g', 170), ('Fats', '34 g', 170), -- Kinder Surprise
('Calories', '448 kcal', 173), ('Carbs', '70 g', 173), ('Proteins', '4 g', 173), ('Fats', '16 g', 173), -- Mars

-- Bakery
('Calories', '420 kcal', 163), ('Carbs', '45 g', 163), ('Proteins', '6 g', 163), ('Fats', '24 g', 163), -- Croissant Vanilla
('Calories', '430 kcal', 162), ('Carbs', '46 g', 162), ('Proteins', '6 g', 162), ('Fats', '25 g', 162), -- Croissant Cocoa
('Calories', '250 kcal', 224), ('Carbs', '50 g', 224), ('Proteins', '9 g', 224), ('Fats', '1 g', 224),  -- Sourdough Bread
('Calories', '380 kcal', 225), ('Carbs', '45 g', 225), ('Proteins', '10 g', 225), ('Fats', '18 g', 225), -- Cozonac

-- Beverages
('Calories', '0 kcal', 148), ('Carbs', '0 g', 148), ('Proteins', '0 g', 148), ('Fats', '0 g', 148), -- Apa plata Bucovina
('Calories', '0 kcal', 151), ('Carbs', '0 g', 151), ('Proteins', '0 g', 151), ('Fats', '0 g', 151), -- Apa minerala Aqua
('Calories', '30 kcal', 152), ('Carbs', '7 g', 152), ('Proteins', '0 g', 152), ('Fats', '0 g', 152), -- Lipton Piersica
('Calories', '42 kcal', 137), ('Carbs', '10.6 g', 137), ('Proteins', '0 g', 137), ('Fats', '0 g', 137), -- Cola Original
('Calories', '43 kcal', 139), ('Carbs', '10.5 g', 139), ('Proteins', '0 g', 139), ('Fats', '0 g', 139), -- Fanta
('Calories', '0 kcal', 138), ('Carbs', '0 g', 138), ('Proteins', '0 g', 138), ('Fats', '0 g', 138), -- Cola Zero

-- Pantry / Dry Goods
('Calories', '359 kcal', 191), ('Carbs', '71 g', 191), ('Proteins', '14 g', 191), ('Fats', '2 g', 191), -- Paste Barilla
('Calories', '348 kcal', 192), ('Carbs', '74 g', 192), ('Proteins', '10 g', 192), ('Fats', '1 g', 192), -- Faina
('Calories', '102 kcal', 194), ('Carbs', '23 g', 194), ('Proteins', '1 g', 194), ('Fats', '0 g', 194), -- Ketchup
('Calories', '680 kcal', 196), ('Carbs', '3 g', 196), ('Proteins', '1 g', 196), ('Fats', '74 g', 196), -- Maioneza

-- Dairy & Eggs
('Calories', '44 kcal', 177), ('Carbs', '4.5 g', 177), ('Proteins', '3.4 g', 177), ('Fats', '1.5 g', 177), -- Lapte 1.5%
('Calories', '62 kcal', 178), ('Carbs', '4.5 g', 178), ('Proteins', '3.3 g', 178), ('Fats', '3.5 g', 178), -- Lapte 3.5%
('Calories', '60 kcal', 183), ('Carbs', '4 g', 183), ('Proteins', '4 g', 183), ('Fats', '3 g', 183), -- Iaurt Activia
('Calories', '270 kcal', 180), ('Carbs', '1 g', 180), ('Proteins', '16 g', 180), ('Fats', '22 g', 180), -- Telemea
('Calories', '748 kcal', 187), ('Carbs', '0.5 g', 187), ('Proteins', '0.5 g', 187), ('Fats', '82 g', 187), -- Unt 82%
('Calories', '290 kcal', 188), ('Carbs', '0 g', 188), ('Proteins', '21 g', 188), ('Fats', '23 g', 188), -- Camembert
('Calories', '143 kcal', 217), ('Carbs', '1 g', 217), ('Proteins', '13 g', 217), ('Fats', '10 g', 217), -- Oua
('Calories', '360 kcal', 219), ('Carbs', '1 g', 219), ('Proteins', '22 g', 219), ('Fats', '30 g', 219), -- Branza Burduf
('Calories', '320 kcal', 222), ('Carbs', '80 g', 222), ('Proteins', '0 g', 222), ('Fats', '0 g', 222), -- Miere

-- Meat & Fish
('Calories', '165 kcal', 282), ('Carbs', '0 g', 282), ('Proteins', '31 g', 282), ('Fats', '3.6 g', 282), -- Piept Pui
('Calories', '209 kcal', 283), ('Carbs', '0 g', 283), ('Proteins', '26 g', 283), ('Fats', '10.9 g', 283), -- Pulpe Pui
('Calories', '260 kcal', 285), ('Carbs', '0 g', 285), ('Proteins', '18 g', 285), ('Fats', '20 g', 285), -- Carne tocata
('Calories', '268 kcal', 286), ('Carbs', '0 g', 286), ('Proteins', '17 g', 286), ('Fats', '21 g', 286), -- Ceafa Porc
('Calories', '291 kcal', 288), ('Carbs', '0 g', 288), ('Proteins', '24 g', 288), ('Fats', '22 g', 288), -- Antricot Vita
('Calories', '208 kcal', 289), ('Carbs', '0 g', 289), ('Proteins', '20 g', 289), ('Fats', '13 g', 289), -- Somon

-- Fruits & Vegetables
('Calories', '52 kcal', 272), ('Carbs', '12 g', 272), ('Proteins', '1.2 g', 272), ('Fats', '0.6 g', 272), -- Zmeura
('Calories', '52 kcal', 252), ('Carbs', '14 g', 252), ('Proteins', '0.3 g', 252), ('Fats', '0.2 g', 252), -- Mere
('Calories', '77 kcal', 264), ('Carbs', '17 g', 264), ('Proteins', '2 g', 264), ('Fats', '0.1 g', 264), -- Cartofi
('Calories', '40 kcal', 261), ('Carbs', '9 g', 261), ('Proteins', '1.1 g', 261), ('Fats', '0.1 g', 261), -- Ceapa
('Calories', '15 kcal', 259), ('Carbs', '3.6 g', 259), ('Proteins', '0.6 g', 259), ('Fats', '0.1 g', 259), -- Castraveti
('Calories', '89 kcal', 250), ('Carbs', '23 g', 250), ('Proteins', '1.1 g', 250), ('Fats', '0.3 g', 250), -- Banane
('Calories', '18 kcal', 257), ('Carbs', '3.9 g', 257), ('Proteins', '0.9 g', 257), ('Fats', '0.2 g', 257), -- Rosii
('Calories', '15 kcal', 268), ('Carbs', '2.9 g', 268), ('Proteins', '1.4 g', 268), ('Fats', '0.2 g', 268); -- Salata verde

SELECT setval(pg_get_serial_sequence('public.product_attribute', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.product_attribute;

COMMIT;