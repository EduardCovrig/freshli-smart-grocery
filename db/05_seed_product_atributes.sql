BEGIN;

-- ==========================================================
-- 8. PRODUCT ATTRIBUTES (Real Values per 100g / 100ml)
-- ==========================================================
INSERT INTO public.product_attribute (name, value, product_id) VALUES 

-- Beverages (Lichide - per 100ml)
('Calories', '42 kcal', 137), ('Carbs', '10.6 g', 137), ('Proteins', '0 g', 137), ('Fats', '0 g', 137), -- Coca-Cola Original
('Calories', '0.2 kcal', 138), ('Carbs', '0 g', 138), ('Proteins', '0 g', 138), ('Fats', '0 g', 138), -- Cola Zero
('Calories', '43 kcal', 139), ('Carbs', '10.5 g', 139), ('Proteins', '0 g', 139), ('Fats', '0 g', 139), -- Fanta
('Calories', '41 kcal', 141), ('Carbs', '11 g', 141), ('Proteins', '0 g', 141), ('Fats', '0 g', 141), -- Pepsi
('Calories', '0.5 kcal', 142), ('Carbs', '0 g', 142), ('Proteins', '0 g', 142), ('Fats', '0 g', 142), -- Pepsi Max
('Calories', '31 kcal', 143), ('Carbs', '7.8 g', 143), ('Proteins', '0 g', 143), ('Fats', '0 g', 143), -- Mirinda
('Calories', '0 kcal', 144), ('Carbs', '0 g', 144), ('Proteins', '0 g', 144), ('Fats', '0 g', 144), -- Apa Dorna
('Calories', '0 kcal', 147), ('Carbs', '0 g', 147), ('Proteins', '0 g', 147), ('Fats', '0 g', 147), -- Apa Borsec
('Calories', '0 kcal', 148), ('Carbs', '0 g', 148), ('Proteins', '0 g', 148), ('Fats', '0 g', 148), -- Apa Bucovina
('Calories', '0 kcal', 149), ('Carbs', '0 g', 149), ('Proteins', '0 g', 149), ('Fats', '0 g', 149), -- Apa Minerala Bucovina
('Calories', '0 kcal', 151), ('Carbs', '0 g', 151), ('Proteins', '0 g', 151), ('Fats', '0 g', 151), -- Apa Aqua
('Calories', '28 kcal', 152), ('Carbs', '6.8 g', 152), ('Proteins', '0 g', 152), ('Fats', '0 g', 152), -- Lipton Piersica
('Calories', '20 kcal', 153), ('Carbs', '4.6 g', 153), ('Proteins', '0 g', 153), ('Fats', '0 g', 153), -- Lipton Lamaie

-- Snacks & Sweets (Solide - per 100g)
('Calories', '534 kcal', 155), ('Carbs', '51 g', 155), ('Proteins', '6.5 g', 155), ('Fats', '34 g', 155), -- Lays Sare
('Calories', '520 kcal', 156), ('Carbs', '50 g', 156), ('Proteins', '6.1 g', 156), ('Fats', '33 g', 156), -- Lays Paprika
('Calories', '525 kcal', 157), ('Carbs', '51 g', 157), ('Proteins', '6.2 g', 157), ('Fats', '32 g', 157), -- Lays Cascaval
('Calories', '514 kcal', 158), ('Carbs', '51 g', 158), ('Proteins', '4 g', 158), ('Fats', '33 g', 158), -- Pringles Original
('Calories', '517 kcal', 159), ('Carbs', '47 g', 159), ('Proteins', '4.5 g', 159), ('Fats', '34 g', 159), -- Pringles Sour Cream
('Calories', '536 kcal', 160), ('Carbs', '52 g', 160), ('Proteins', '6.1 g', 160), ('Fats', '34 g', 160), -- Chio Sare
('Calories', '523 kcal', 161), ('Carbs', '51 g', 161), ('Proteins', '6 g', 161), ('Fats', '32 g', 161), -- Chio Smantana
('Calories', '452 kcal', 162), ('Carbs', '45 g', 162), ('Proteins', '7.1 g', 162), ('Fats', '26 g', 162), -- Croissant Cacao
('Calories', '448 kcal', 163), ('Carbs', '47 g', 163), ('Proteins', '6.5 g', 163), ('Fats', '25 g', 163), -- Croissant Vanilie
('Calories', '444 kcal', 164), ('Carbs', '64 g', 164), ('Proteins', '13 g', 164), ('Fats', '14 g', 164), -- Bake Rolls Usturoi
('Calories', '530 kcal', 165), ('Carbs', '59 g', 165), ('Proteins', '6.3 g', 165), ('Fats', '29 g', 165), -- Milka Lapte
('Calories', '542 kcal', 166), ('Carbs', '52 g', 166), ('Proteins', '7.3 g', 166), ('Fats', '33 g', 166), -- Milka Alune
('Calories', '555 kcal', 167), ('Carbs', '55 g', 167), ('Proteins', '5.2 g', 167), ('Fats', '35 g', 167), -- Milka Oreo
('Calories', '566 kcal', 169), ('Carbs', '52 g', 169), ('Proteins', '8.7 g', 169), ('Fats', '35 g', 169), -- Kinder Chocolate
('Calories', '552 kcal', 170), ('Carbs', '52 g', 170), ('Proteins', '8.1 g', 170), ('Fats', '34 g', 170), -- Kinder Surprise
('Calories', '539 kcal', 171), ('Carbs', '57 g', 171), ('Proteins', '6.3 g', 171), ('Fats', '30 g', 171), -- Nutella 400g
('Calories', '521 kcal', 172), ('Carbs', '59 g', 172), ('Proteins', '7.2 g', 172), ('Fats', '27 g', 172), -- Nutella B-ready
('Calories', '449 kcal', 173), ('Carbs', '70 g', 173), ('Proteins', '4.1 g', 173), ('Fats', '17 g', 173), -- Mars Bar
('Calories', '480 kcal', 175), ('Carbs', '69 g', 175), ('Proteins', '5.2 g', 175), ('Fats', '20 g', 175), -- Oreo Original
('Calories', '490 kcal', 176), ('Carbs', '67 g', 176), ('Proteins', '4.8 g', 176), ('Fats', '21 g', 176), -- Oreo Double

-- Dairy & Eggs
('Calories', '44 kcal', 177), ('Carbs', '4.5 g', 177), ('Proteins', '3.2 g', 177), ('Fats', '1.5 g', 177), -- Lapte 1.5%
('Calories', '62 kcal', 178), ('Carbs', '4.5 g', 178), ('Proteins', '3.2 g', 178), ('Fats', '3.5 g', 178), -- Lapte 3.5%
('Calories', '270 kcal', 180), ('Carbs', '1 g', 180), ('Proteins', '16 g', 180), ('Fats', '22 g', 180), -- Telemea Vaca
('Calories', '44 kcal', 181), ('Carbs', '4.5 g', 181), ('Proteins', '3.2 g', 181), ('Fats', '1.5 g', 181), -- Zuzu 1.5%
('Calories', '62 kcal', 182), ('Carbs', '4.7 g', 182), ('Proteins', '3.3 g', 182), ('Fats', '3.5 g', 182), -- Iaurt Zuzu
('Calories', '60 kcal', 183), ('Carbs', '4.6 g', 183), ('Proteins', '3.4 g', 183), ('Fats', '3.1 g', 183), -- Iaurt Activia
('Calories', '748 kcal', 187), ('Carbs', '0.6 g', 187), ('Proteins', '0.5 g', 187), ('Fats', '82 g', 187), -- Unt President
('Calories', '297 kcal', 188), ('Carbs', '0.1 g', 188), ('Proteins', '20 g', 188), ('Fats', '24 g', 188), -- Camembert
('Calories', '143 kcal', 216), ('Carbs', '0.7 g', 216), ('Proteins', '12.6 g', 216), ('Fats', '9.5 g', 216), -- Oua M
('Calories', '143 kcal', 217), ('Carbs', '0.7 g', 217), ('Proteins', '12.6 g', 217), ('Fats', '9.5 g', 217), -- Oua L
('Calories', '364 kcal', 219), ('Carbs', '1.2 g', 219), ('Proteins', '23 g', 219), ('Fats', '28 g', 219), -- Branza Burduf
('Calories', '320 kcal', 220), ('Carbs', '1 g', 220), ('Proteins', '25 g', 220), ('Fats', '24 g', 220), -- Cascaval Casa
('Calories', '285 kcal', 221), ('Carbs', '1 g', 221), ('Proteins', '17 g', 221), ('Fats', '24 g', 221), -- Telemea Oaie

-- Bakery & Pantry
('Calories', '350 kcal', 189), ('Carbs', '71 g', 189), ('Proteins', '12 g', 189), ('Fats', '1.5 g', 189), -- Penne Rigate
('Calories', '352 kcal', 190), ('Carbs', '72 g', 190), ('Proteins', '12 g', 190), ('Fats', '1.5 g', 190), -- Spaghetti
('Calories', '355 kcal', 191), ('Carbs', '71 g', 191), ('Proteins', '12 g', 191), ('Fats', '1.5 g', 191), -- Fusilli
('Calories', '341 kcal', 192), ('Carbs', '71 g', 192), ('Proteins', '10.3 g', 192), ('Fats', '1 g', 192), -- Faina 000
('Calories', '102 kcal', 194), ('Carbs', '23.2 g', 194), ('Proteins', '1.2 g', 194), ('Fats', '0.1 g', 194), -- Ketchup Heinz
('Calories', '105 kcal', 195), ('Carbs', '24 g', 195), ('Proteins', '1.1 g', 195), ('Fats', '0.1 g', 195), -- Ketchup Picant
('Calories', '680 kcal', 196), ('Carbs', '3 g', 196), ('Proteins', '1 g', 196), ('Fats', '75 g', 196), -- Maioneza
('Calories', '26 kcal', 197), ('Carbs', '4.8 g', 197), ('Proteins', '1.1 g', 197), ('Fats', '0.2 g', 197), -- Pulpa Rosii
('Calories', '325 kcal', 222), ('Carbs', '81 g', 222), ('Proteins', '0.3 g', 222), ('Fats', '0 g', 222), -- Miere Poliflora
('Calories', '304 kcal', 223), ('Carbs', '82 g', 223), ('Proteins', '0.3 g', 223), ('Fats', '0 g', 223), -- Miere Salcam
('Calories', '245 kcal', 224), ('Carbs', '46 g', 224), ('Proteins', '8.5 g', 224), ('Fats', '1.1 g', 224), -- Paine Maia
('Calories', '385 kcal', 225), ('Carbs', '48 g', 225), ('Proteins', '9.2 g', 225), ('Fats', '16 g', 225), -- Cozonac

-- Fruits & Vegetables
('Calories', '89 kcal', 250), ('Carbs', '22.8 g', 250), ('Proteins', '1.1 g', 250), ('Fats', '0.3 g', 250), -- Banane
('Calories', '52 kcal', 251), ('Carbs', '13.8 g', 251), ('Proteins', '0.3 g', 251), ('Fats', '0.2 g', 251), -- Mere Ionatan
('Calories', '52 kcal', 252), ('Carbs', '14 g', 252), ('Proteins', '0.4 g', 252), ('Fats', '0.2 g', 252), -- Mere Granny Smith
('Calories', '57 kcal', 253), ('Carbs', '15 g', 253), ('Proteins', '0.4 g', 253), ('Fats', '0.1 g', 253), -- Pere
('Calories', '46 kcal', 254), ('Carbs', '11.4 g', 254), ('Proteins', '0.7 g', 254), ('Fats', '0.3 g', 254), -- Prune
('Calories', '50 kcal', 255), ('Carbs', '12 g', 255), ('Proteins', '1.1 g', 255), ('Fats', '0.3 g', 255), -- Cirese
('Calories', '32 kcal', 256), ('Carbs', '7.7 g', 256), ('Proteins', '0.7 g', 256), ('Fats', '0.3 g', 256), -- Capsuni
('Calories', '18 kcal', 257), ('Carbs', '3.9 g', 257), ('Proteins', '0.9 g', 257), ('Fats', '0.2 g', 257), -- Rosii
('Calories', '18 kcal', 258), ('Carbs', '3.9 g', 258), ('Proteins', '0.9 g', 258), ('Fats', '0.2 g', 258), -- Rosii Cherry
('Calories', '24 kcal', 205), ('Carbs', '5.1 g', 205), ('Proteins', '1.2 g', 205), ('Fats', '0.2 g', 205), -- Mini Tomate
('Calories', '15 kcal', 259), ('Carbs', '3.6 g', 259), ('Proteins', '0.7 g', 259), ('Fats', '0.1 g', 259), -- Castraveti
('Calories', '40 kcal', 261), ('Carbs', '9.3 g', 261), ('Proteins', '1.1 g', 261), ('Fats', '0.1 g', 261), -- Ceapa Galbena
('Calories', '33 kcal', 262), ('Carbs', '7.6 g', 262), ('Proteins', '0.9 g', 262), ('Fats', '0.1 g', 262), -- Ceapa Rosie
('Calories', '41 kcal', 263), ('Carbs', '9.6 g', 263), ('Proteins', '0.9 g', 263), ('Fats', '0.2 g', 263), -- Morcovi
('Calories', '77 kcal', 264), ('Carbs', '17 g', 264), ('Proteins', '2 g', 264), ('Fats', '0.1 g', 264), -- Cartofi Albi
('Calories', '70 kcal', 265), ('Carbs', '16 g', 265), ('Proteins', '1.9 g', 265), ('Fats', '0.1 g', 265), -- Cartofi Rosii
('Calories', '149 kcal', 266), ('Carbs', '33 g', 266), ('Proteins', '6.4 g', 266), ('Fats', '0.5 g', 266), -- Usturoi
('Calories', '25 kcal', 267), ('Carbs', '5.8 g', 267), ('Proteins', '1.3 g', 267), ('Fats', '0.1 g', 267), -- Varza Alba
('Calories', '15 kcal', 268), ('Carbs', '2.9 g', 268), ('Proteins', '1.4 g', 268), ('Fats', '0.2 g', 268), -- Salata Verde
('Calories', '50 kcal', 269), ('Carbs', '12 g', 269), ('Proteins', '1 g', 269), ('Fats', '0.5 g', 269), -- Fructe Padure
('Calories', '39 kcal', 270), ('Carbs', '9.5 g', 270), ('Proteins', '0.9 g', 270), ('Fats', '0.3 g', 270), -- Piersici
('Calories', '30 kcal', 271), ('Carbs', '7.5 g', 271), ('Proteins', '0.6 g', 271), ('Fats', '0.2 g', 271), -- Pepene
('Calories', '52 kcal', 272), ('Carbs', '11.9 g', 272), ('Proteins', '1.2 g', 272), ('Fats', '0.6 g', 272), -- Zmeura
('Calories', '67 kcal', 273), ('Carbs', '17 g', 273), ('Proteins', '0.6 g', 273), ('Fats', '0.4 g', 273), -- Struguri

-- Meat & Fish (NOU!)
('Calories', '165 kcal', 282), ('Carbs', '0 g', 282), ('Proteins', '31 g', 282), ('Fats', '3.6 g', 282), -- Piept Pui
('Calories', '209 kcal', 283), ('Carbs', '0 g', 283), ('Proteins', '26 g', 283), ('Fats', '10.9 g', 283), -- Pulpe Pui
('Calories', '190 kcal', 284), ('Carbs', '0 g', 284), ('Proteins', '18 g', 284), ('Fats', '12 g', 284), -- Aripioare Pui
('Calories', '241 kcal', 285), ('Carbs', '0 g', 285), ('Proteins', '17 g', 285), ('Fats', '19 g', 285), -- Carne Tocata Mixta
('Calories', '232 kcal', 286), ('Carbs', '0 g', 286), ('Proteins', '18 g', 286), ('Fats', '18 g', 286), -- Ceafa Porc
('Calories', '155 kcal', 287), ('Carbs', '0 g', 287), ('Proteins', '21 g', 287), ('Fats', '8 g', 287), -- Cotlet Porc
('Calories', '291 kcal', 288), ('Carbs', '0 g', 288), ('Proteins', '24 g', 288), ('Fats', '22 g', 288), -- Antricot Vita
('Calories', '208 kcal', 289), ('Carbs', '0 g', 289), ('Proteins', '20 g', 289), ('Fats', '13 g', 289), -- Somon
('Calories', '148 kcal', 290), ('Carbs', '0 g', 290), ('Proteins', '21 g', 290), ('Fats', '7 g', 290), -- Pastrav
('Calories', '127 kcal', 291), ('Carbs', '0 g', 291), ('Proteins', '18 g', 291), ('Fats', '6 g', 291), -- Crap
('Calories', '85 kcal', 292), ('Carbs', '3.1 g', 292), ('Proteins', '15 g', 292), ('Fats', '1.1 g', 292), -- Fructe de Mare
('Calories', '260 kcal', 294), ('Carbs', '2.5 g', 294), ('Proteins', '13 g', 294), ('Fats', '22 g', 294), -- Carnati Pui
('Calories', '165 kcal', 295), ('Carbs', '1.1 g', 295), ('Proteins', '21 g', 295), ('Fats', '8.5 g', 295), -- Muschi File

-- Bakery New
('Calories', '265 kcal', 300), ('Carbs', '49 g', 300), ('Proteins', '8 g', 300), ('Fats', '3.2 g', 300), -- White Bread
('Calories', '240 kcal', 301), ('Carbs', '41 g', 301), ('Proteins', '10 g', 301), ('Fats', '2.5 g', 301), -- Whole Wheat
('Calories', '270 kcal', 302), ('Carbs', '54 g', 302), ('Proteins', '9 g', 302), ('Fats', '1 g', 302), -- Baguette
('Calories', '280 kcal', 303), ('Carbs', '50 g', 303), ('Proteins', '8.5 g', 303), ('Fats', '4.5 g', 303), -- Burger Buns
('Calories', '325 kcal', 304), ('Carbs', '41 g', 304), ('Proteins', '40 g', 304), ('Fats', '5 g', 304), -- Dry Yeast
('Calories', '53 kcal', 305), ('Carbs', '27 g', 305), ('Proteins', '0.1 g', 305), ('Fats', '0 g', 305), -- Baking powder
('Calories', '288 kcal', 306), ('Carbs', '12 g', 306), ('Proteins', '0 g', 306), ('Fats', '0 g', 306), -- Vanilla extract
('Calories', '340 kcal', 307), ('Carbs', '72 g', 307), ('Proteins', '11 g', 307), ('Fats', '1 g', 307), -- Pizza Flour
('Calories', '412 kcal', 308), ('Carbs', '72 g', 308), ('Proteins', '11 g', 308), ('Fats', '8 g', 308), -- Breadsticks

-- Pastry New
('Calories', '406 kcal', 309), ('Carbs', '45 g', 309), ('Proteins', '8 g', 309), ('Fats', '21 g', 309), -- Butter Croissant
('Calories', '420 kcal', 310), ('Carbs', '52 g', 310), ('Proteins', '5.5 g', 310), ('Fats', '20 g', 310), -- Mini Cake
('Calories', '375 kcal', 311), ('Carbs', '48 g', 311), ('Proteins', '5 g', 311), ('Fats', '18 g', 311), -- Muffin
('Calories', '390 kcal', 312), ('Carbs', '55 g', 312), ('Proteins', '8 g', 312), ('Fats', '15 g', 312), -- Cozonac
('Calories', '385 kcal', 313), ('Carbs', '50 g', 313), ('Proteins', '5 g', 313), ('Fats', '18 g', 313), -- Strudel
('Calories', '430 kcal', 314), ('Carbs', '58 g', 314), ('Proteins', '4.5 g', 314), ('Fats', '22 g', 314), -- Vanilla Rolls
('Calories', '360 kcal', 315), ('Carbs', '52 g', 315), ('Proteins', '6.5 g', 315), ('Fats', '13 g', 315), -- Panettone
('Calories', '410 kcal', 316), ('Carbs', '51 g', 316), ('Proteins', '6 g', 316), ('Fats', '20 g', 316), -- Mini Croissants

-- Sweets & Snacks New
('Calories', '605 kcal', 317), ('Carbs', '13 g', 317), ('Proteins', '25 g', 317), ('Fats', '49 g', 317), -- Peanuts
('Calories', '562 kcal', 318), ('Carbs', '27 g', 318), ('Proteins', '20 g', 318), ('Fats', '45 g', 318), -- Pistachios
('Calories', '580 kcal', 319), ('Carbs', '36 g', 319), ('Proteins', '8 g', 319), ('Fats', '42 g', 319), -- Dark Chocolate
('Calories', '520 kcal', 320), ('Carbs', '62 g', 320), ('Proteins', '6 g', 320), ('Fats', '27 g', 320), -- Wafer Bar
('Calories', '495 kcal', 321), ('Carbs', '68 g', 321), ('Proteins', '7 g', 321), ('Fats', '21 g', 321), -- Sticks
('Calories', '343 kcal', 322), ('Carbs', '77 g', 322), ('Proteins', '6.9 g', 322), ('Fats', '0.1 g', 322), -- Gummy Bears
('Calories', '505 kcal', 323), ('Carbs', '59 g', 323), ('Proteins', '6.5 g', 323), ('Fats', '26 g', 323), -- Tortilla
('Calories', '420 kcal', 324), ('Carbs', '82 g', 324), ('Proteins', '3.5 g', 324), ('Fats', '8 g', 324), -- Caramel Popcorn
('Calories', '318 kcal', 325), ('Carbs', '79 g', 325), ('Proteins', '4.7 g', 325), ('Fats', '0.2 g', 325), -- Marshmallows
('Calories', '590 kcal', 326), ('Carbs', '42 g', 326), ('Proteins', '4 g', 326), ('Fats', '45 g', 326), -- Truffles

-- Beverages New (Coffee/Tea per 100g dry, standard labeling)
('Calories', '2 kcal', 327), ('Carbs', '0.2 g', 327), ('Proteins', '0.1 g', 327), ('Fats', '0 g', 327), -- Espresso
('Calories', '2 kcal', 328), ('Carbs', '0.2 g', 328), ('Proteins', '0.1 g', 328), ('Fats', '0 g', 328), -- Instant
('Calories', '1 kcal', 329), ('Carbs', '0.2 g', 329), ('Proteins', '0 g', 329), ('Fats', '0 g', 329), -- Green Tea
('Calories', '1 kcal', 330), ('Carbs', '0.2 g', 330), ('Proteins', '0 g', 330), ('Fats', '0 g', 330); -- Black Tea



SELECT setval(pg_get_serial_sequence('public.product_attribute', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.product_attribute;

COMMIT;