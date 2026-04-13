BEGIN;

-- ==========================================
-- 6. PRODUCTS
-- ==========================================
INSERT INTO public.product (id, description, expiration_date, name, near_expiry_quantity, price, stock_quantity, unit_of_measure, brand_id, category_id) VALUES
-- Snacks & Sweets (buc)
(156, 'Crunchy potato chips with a rich and smoky paprika flavor. Perfect for parties.', '2026-03-22', 'Paprika Potato Chips 140g', 0, 8, 25, 'buc', 29, 4),
(164, 'Twice-baked bread crisps with a savory garlic and herb seasoning.', '2026-03-04', 'Garlic Bake Rolls 80g', 0, 4.5, 90, 'buc', 33, 4),
(160, 'Classic salted potato chips, perfectly crispy for any snack time.', '2026-03-09', 'Salted Potato Chips 140g', 43, 7.5, 43, 'buc', 31, 4),
(167, 'Smooth milk chocolate filled with crunchy Oreo biscuit pieces.', '2026-03-10', 'Oreo Milk Chocolate 100g', 116, 6, 116, 'buc', 34, 4),
(169, 'Classic, creamy milk chocolate that melts in your mouth.', '2026-03-13', 'Classic Milk Chocolate 100g', 84, 6.5, 84, 'buc', 35, 4),
(161, 'Crispy potato chips with a tangy sour cream and onion flavor.', '2026-03-19', 'Sour Cream Chips 140g', 0, 7.5, 76, 'buc', 31, 4),
(166, 'Rich milk chocolate packed with crunchy roasted hazelnuts.', '2026-03-20', 'Hazelnut Chocolate 100g', 0, 6, 107, 'buc', 34, 4),
(172, 'Crispy baked wafer filled with creamy hazelnut chocolate spread.', '2026-03-03', 'Nutella B-ready 132g', 0, 12, 63, 'buc', 36, 4),
(171, 'Classic creamy chocolate and hazelnut spread for breakfasts and desserts.', '2026-03-21', 'Hazelnut Cocoa Spread 400g', 0, 16.5, 31, 'buc', 36, 4),
(175, 'Classic crunchy wheat biscuits, perfect with a cup of tea or milk.', '2026-03-15', 'Original Biscuits 154g', 0, 5.5, 118, 'buc', 39, 4),
(158, 'Iconic stackable potato crisps with a classic salty taste.', '2026-03-10', 'Original Potato Crisps 165g', 49, 12.5, 49, 'buc', 30, 4),
(176, 'Chocolate cookies with a double layer of sweet vanilla cream.', '2026-03-05', 'Double Creme Biscuits 157g', 0, 6.5, 41, 'buc', 39, 4),
(170, 'Milk chocolate egg featuring a fun surprise toy inside.', '2026-03-13', 'Surprise Chocolate Egg 20g', 115, 5, 115, 'buc', 35, 4),
(157, 'Crunchy potato chips loaded with savory cheese flavor.', '2026-02-25', 'Cheese Flavored Chips 140g', 0, 8.5, 54, 'buc', 29, 4),
(159, 'Stackable crisps packed with a tangy sour cream and onion kick.', '2026-03-01', 'Sour Cream & Onion Crisps 165g', 0, 12.5, 112, 'buc', 30, 4),
(165, 'Smooth and creamy classic milk chocolate bar.', '2026-02-23', 'Classic Milk Chocolate Bar 100g', 0, 5.5, 0, 'buc', 34, 4),
(173, 'A quick and satisfying chocolate treat.', '2026-02-24', 'Chocolate Bar 50g', 0, 3.5, 0, 'buc', 37, 4),
(155, 'Classic thin potato chips with a touch of salt.', '2026-03-12', 'Salted Thin Chips 140g', 75, 8.5, 75, 'buc', 29, 4),

-- Pastry / Bakery
(163, 'Soft, flaky pastry filled with rich vanilla cream.', '2026-03-14', 'Vanilla Cream Croissant 80g', 10, 3.5, 45, 'buc', 32, 7),
(162, 'Freshly baked croissant with a decadent cocoa filling.', '2026-03-15', 'Cocoa Cream Croissant 80g', 0, 3.5, 101, 'buc', 32, 7),
(224, 'Rustic artisan bread baked with natural sourdough.', '2026-03-04', 'Artisan Sourdough Bread 500g', 0, 8, 94, 'buc', 50, 1),
(225, 'Traditional sweet bread loaded with a rich walnut filling.', '2026-02-28', 'Traditional Walnut Sweet Bread 500g', 0, 45, 105, 'buc', 50, 7),

-- Beverages
(148, 'Pure and refreshing still mineral water.', '2026-03-20', 'Still Mineral Water 1.5L', 0, 3.2, 98, 'buc', 25, 2),
(149, 'Crisp and refreshing carbonated mineral water.', '2026-03-02', 'Sparkling Mineral Water 1.5L', 0, 3.2, 16, 'buc', 25, 2),
(151, 'Naturally carbonated mineral water, sourced from the mountains.', '2026-03-02', 'Premium Sparkling Water 1.5L', 0, 3.9, 31, 'buc', 26, 2),
(152, 'Refreshing iced tea infused with sweet peach flavor.', '2026-03-08', 'Peach Iced Tea 1.5L', 109, 7.5, 109, 'buc', 27, 2),
(153, 'Classic iced tea with a zesty lemon twist.', '2026-03-11', 'Lemon Iced Tea 1.5L', 48, 7.5, 48, 'buc', 27, 2),
(137, 'The classic, refreshing original cola beverage.', '2026-08-08', 'Coca-Cola Original 2L', 0, 10.5, 55, 'buc', 21, 2),
(143, 'Sweet and bubbly orange-flavored carbonated drink.', '2026-02-22', 'Orange Soda 2L', 0, 8, 34, 'buc', 22, 2),
(139, 'Bright, bubbly, and instantly refreshing orange soda.', '2026-08-04', 'Orange Soda Classic 2L', 0, 9, 3, 'buc', 21, 2),
(141, 'Bold, refreshing cola flavor.', '2026-03-11', 'Cola Beverage 2L', 61, 8.5, 61, 'buc', 22, 2),
(147, 'Large bottle of pure, natural still spring water.', '2026-03-12', 'Still Spring Water 2L', 84, 3.4, 84, 'buc', 24, 2),
(138, 'The great cola taste with zero sugar and zero calories.', '2026-06-06', 'Cola Zero Sugar 2L', 82, 9.5, 224, 'buc', 21, 2),
(142, 'Maximum cola taste with no sugar.', '2026-03-22', 'Cola Max Zero 2L', 0, 8.5, 37, 'buc', 22, 2),
(144, 'Bubbly and refreshing natural mineral water.', '2026-03-18', 'Sparkling Natural Water 1.5L', 0, 3.5, 104, 'buc', 23, 2),

-- Pantry / Dry Goods
(191, 'High-quality durum wheat semolina fusilli pasta.', '2026-02-23', 'Fusilli Pasta 500g', 0, 7.5, 97, 'buc', 45, 1),
(189, 'Classic ridged penne pasta, holds sauce perfectly.', '2026-02-22', 'Penne Rigate Pasta 500g', 0, 7.5, 74, 'buc', 45, 1),
(190, 'Traditional long, thin spaghetti pasta.', '2026-03-02', 'Spaghetti Pasta 500g', 0, 7.5, 38, 'buc', 45, 1),
(192, 'Premium refined white flour, ideal for baking.', '2026-03-12', 'Premium White Flour 000 1kg', 60, 4.5, 60, 'buc', 46, 1),
(194, 'Rich and sweet tomato ketchup, perfect for fries and burgers.', '2026-03-15', 'Sweet Tomato Ketchup 400g', 0, 12, 48, 'buc', 47, 5),
(195, 'Tomato ketchup with an extra spicy kick.', '2026-03-21', 'Spicy Tomato Ketchup 400g', 0, 12.5, 64, 'buc', 47, 5),
(196, 'Rich and creamy classic mayonnaise.', '2026-03-13', 'Original Mayonnaise 400ml', 22, 14, 22, 'buc', 48, 6),
(197, 'High-quality crushed tomatoes, perfect as a pasta sauce base.', '2026-02-21', 'Crushed Tomato Pulp 400g', 0, 6.5, 92, 'buc', 49, 5),

-- Dairy & Eggs
(177, 'Fresh pasteurized cow milk with 1.5% fat.', '2026-03-19', 'Milk 1.5% Fat 1L', 0, 7.5, 81, 'buc', 40, 6),
(178, 'Rich and creamy fresh cow milk with 3.5% fat.', '2026-03-05', 'Milk 3.5% Fat 1L', 0, 8.5, 76, 'buc', 40, 6),
(183, 'Smooth and natural probiotic yogurt for a healthy digestion.', '2026-03-05', 'Plain Probiotic Yogurt 140g', 0, 3, 102, 'buc', 42, 6),
(182, 'Classic creamy natural yogurt.', '2026-03-15', 'Plain Natural Yogurt 140g', 0, 2.5, 29, 'buc', 41, 6),
(180, 'Traditional Romanian salty white cheese made from cow milk.', '2026-02-22', 'Cow Milk Telemea Cheese 350g', 0, 22, 0, 'buc', 40, 6),
(181, 'Pasteurized, low-fat milk for everyday use.', '2026-02-23', 'Low-Fat Milk 1.5% 1L', 0, 7, 0, 'buc', 41, 6),
(187, 'Rich, premium unsalted butter with 82% fat content.', '2026-03-02', 'Premium Butter 82% 200g', 0, 15.5, 0, 'buc', 44, 6),
(188, 'Soft, creamy French-style cheese with a bloomy rind.', '2026-03-02', 'Camembert Cheese 250g', 0, 19, 0, 'buc', 44, 6),
(217, 'Tray of 30 large, farm-fresh eggs.', '2026-03-17', 'Fresh Farm Eggs L 30pcs', 0, 32, 117, 'buc', 50, 6),
(219, 'Strong, salty, and crumbly traditional sheep milk cheese.', '2026-03-20', 'Traditional Burduf Cheese 300g', 0, 25, 114, 'buc', 50, 6),
(220, 'Semi-hard yellow cheese made from a traditional recipe.', '2026-03-17', 'Homemade Yellow Cheese 300g', 0, 22, 78, 'buc', 50, 6),
(221, 'Authentic, salty white cheese made purely from sheep milk.', '2026-03-15', 'Sheep Milk Telemea 400g', 0, 30, 94, 'buc', 50, 6),
(216, 'Carton of 10 medium, farm-fresh eggs.', '2026-02-23', 'Fresh Farm Eggs M 10pcs', 0, 12, 33, 'buc', 50, 6),

-- Honey
(222, '100% natural, sweet polyfloral honey.', '2026-03-21', 'Polyfloral Honey 500g', 0, 25, 32, 'buc', 50, 4),
(223, 'Premium, light and delicate natural acacia honey.', '2026-03-06', 'Acacia Honey 500g', 107, 35, 107, 'buc', 50, 4),

-- Meat & Fish
(282, 'Fresh, lean, and tender boneless chicken breast.', '2026-03-25', 'Boneless Chicken Breast 1kg', 0, 29.0, 45, 'kg', 50, 3),
(283, 'Juicy and flavorful bone-in chicken thighs.', '2026-03-24', 'Chicken Thighs 1kg', 0, 23.0, 52, 'kg', 50, 3),
(284, 'Fresh chicken wings, perfect for frying or grilling.', '2026-03-12', 'Chicken Wings 1kg', 15, 20.0, 38, 'kg', 50, 3),
(285, 'A balanced blend of minced pork and beef.', '2026-03-26', 'Mixed Minced Meat 1kg', 0, 32.0, 60, 'kg', 50, 3),
(286, 'Highly marbled and flavorful pork collar cut.', '2026-03-23', 'Pork Nape 1kg', 0, 39.0, 41, 'kg', 50, 3),
(287, 'Premium lean pork chops, excellent for pan-searing.', '2026-03-14', 'Boneless Pork Chop 1kg', 10, 42.0, 25, 'kg', 50, 3),
(288, 'Thick, tender, and juicy beef ribeye steak.', '2026-03-28', 'Beef Ribeye Steak 1kg', 0, 116.0, 18, 'kg', 50, 3),
(289, 'Fresh Atlantic salmon fillet, rich in omega-3.', '2026-03-21', 'Fresh Salmon Fillet 1kg', 0, 114.0, 30, 'kg', 50, 3),
(290, 'Whole cleaned trout, ready to bake or grill.', '2026-03-11', 'Eviscerated Trout 1kg', 8, 45.0, 22, 'kg', 50, 3),
(291, 'Fresh cleaned carp, ideal for traditional dishes.', '2026-03-22', 'Eviscerated Carp 1kg', 0, 44.0, 15, 'kg', 50, 3),
(292, 'A premium selection of frozen shrimp, mussels, and squid.', '2026-04-15', 'Mixed Seafood 1kg', 0, 80.0, 40, 'kg', 50, 3),
(294, 'Mild and tasty sausages made from chicken meat.', '2026-03-18', 'Chicken Sausages 1kg', 0, 40.0, 70, 'kg', 50, 3),
(295, 'Delicately smoked, premium lean pork tenderloin.', '2026-04-05', 'Smoked Pork Tenderloin 1kg', 0, 77.5, 65, 'kg', 50, 3),

-- ====================================================
-- FRUITS & VEGETABLES (AJUSTATE LA 1KG)
-- ====================================================
(272, 'Fresh, sweet, and tart raspberries picked from local farms.', '2026-02-27', 'Fresh Raspberries 1kg', 0, 40.0, 30, 'kg', 50, 5),
(254, 'Juicy and ripe plums, naturally sweet and packed with vitamins.', '2026-02-22', 'Fresh Plums 1kg', 0, 4.5, 130, 'kg', 50, 5),
(255, 'Premium sweet red cherries, fresh and incredibly juicy.', '2026-02-21', 'Sweet Cherries 1kg', 0, 25.0, 132, 'kg', 50, 5),
(252, 'Crisp, tart, and refreshing green apples. Excellent for baking or snacking.', '2026-02-26', 'Granny Smith Apples 1kg', 0, 6.0, 368, 'kg', 50, 5),
(251, 'Sweet and slightly tart red apples, freshly harvested.', '2026-03-05', 'Jonathan Apples 1kg', 0, 5.5, 455, 'kg', 50, 5),
(253, 'Soft, sweet, and juicy fresh pears.', '2026-03-03', 'Fresh Pears 1kg', 0, 8.5, 379, 'kg', 50, 5),
(264, 'Versatile white potatoes, perfect for boiling, baking, or mashing.', '2026-03-03', 'White Potatoes 1kg', 0, 3.5, 577, 'kg', 50, 5),
(273, 'Sweet and seedless table grapes, fresh from the vine.', '2026-03-05', 'Fresh White Grapes 1kg', 0, 15.0, 835, 'kg', 50, 5),
(261, 'Essential yellow onions for cooking, roasting, and seasoning.', '2026-02-27', 'Yellow Onion 1kg', 0, 3.5, 20, 'kg', 50, 5),
(256, 'Sweet, red, and juicy strawberries, perfectly ripe.', '2026-02-25', 'Fresh Strawberries 1kg', 0, 18.0, 363, 'kg', 50, 5),
(259, 'Fresh and hydrating crunchy cucumbers for daily salads.', '2026-02-18', 'Fresh Cucumbers 1kg', 0, 7.0, 10, 'kg', 50, 5),
(262, 'Mild and sweet red onions, great for salads and sandwiches.', '2026-02-24', 'Red Onion 1kg', 0, 4.5, 88, 'kg', 50, 5),
(263, 'Crunchy and sweet fresh carrots, rich in Vitamin A.', '2026-02-21', 'Fresh Carrots 1kg', 0, 3.0, 100, 'kg', 50, 5),
(250, 'Premium yellow bananas, naturally rich in potassium and energy.', '2026-02-21', 'Yellow Bananas 1kg', 0, 7.0, 339, 'kg', 50, 5),
(265, 'Firm red potatoes, excellent for roasting and potato salads.', '2026-02-25', 'Red Potatoes 1kg', 0, 3.5, 100, 'kg', 50, 5),
(257, 'Fresh, vine-ripened red tomatoes.', '2026-03-02', 'Fresh Tomatoes 1kg', 0, 10.0, 100, 'kg', 50, 5),
(268, 'Crisp and fresh green lettuce leaves.', '2026-03-02', 'Green Lettuce 1kg', 0, 15.0, 441, 'kg', 50, 5),
(270, 'Soft, juicy, and sweet fresh peaches.', '2026-02-21', 'Fresh Peaches 1kg', 0, 12.0, 889, 'kg', 50, 5),
(271, 'Sweet and refreshing watermelon, perfect for hot days.', '2026-02-23', 'Watermelon 1kg', 0, 8.0, 790, 'kg', 50, 5),
(266, 'Aromatic fresh garlic bulbs for everyday cooking.', '2026-03-02', 'Fresh Garlic 1kg', 0, 20.0, 221, 'kg', 50, 5),
(267, 'Fresh and crunchy white cabbage, ideal for salads and cooking.', '2026-02-25', 'White Cabbage 1kg', 0, 3.0, 100, 'kg', 50, 5),
(269, 'A vibrant mix of fresh wild berries, packed with antioxidants.', '2026-02-23', 'Mixed Forest Berries 1kg', 0, 30.0, 174, 'kg', 50, 5),
(258, 'Bite-sized, sweet and juicy cherry tomatoes.', '2026-02-22', 'Cherry Tomatoes 250g', 0, 8.0, 100, 'buc', 50, 5),
(205, 'Vibrant, sweet, and juicy mini tomatoes.', '2026-03-05', 'Sweet Cherry Tomatoes 250g', 0, 8.0, 70, 'buc', 50, 5),

-- Bakery (Breads, Buns, Baking Goods)
(300, 'Sliced white bread, soft and versatile for daily sandwiches.', '2026-03-08', 'Classic White Bread 500g', 0, 5.5, 120, 'buc', 53, 1),
(301, 'Healthy whole wheat bread, rich in fiber and seeds.', '2026-03-06', 'Whole Wheat Bread 500g', 35, 7.0, 35, 'buc', 53, 1),
(302, 'Traditional French baguette, crispy outside and airy inside.', '2026-02-22', 'French Baguette 250g', 0, 3.5, 150, 'buc', 57, 1),
(303, 'Soft burger buns with sesame seeds, pack of 4.', '2026-03-10', 'Sesame Burger Buns 300g', 0, 6.0, 80, 'buc', 53, 1),
(304, 'Fine dry yeast for fluffy pastries and perfect doughs.', '2027-01-15', 'Dry Yeast 7g', 0, 1.5, 500, 'buc', 54, 1),
(305, 'Baking powder for guaranteed rise in your cakes.', '2027-02-20', 'Baking Powder 10g', 0, 1.2, 500, 'buc', 54, 1),
(306, 'Vanilla essence to add a rich aroma to your desserts.', '2027-03-10', 'Vanilla Extract 38ml', 0, 8.5, 120, 'buc', 54, 1),
(307, 'Premium pasta flour for the perfect homemade pizza or pasta.', '2026-08-15', 'Pizza Flour Tipo 00 1kg', 0, 6.5, 200, 'buc', 51, 1),
(308, 'Crunchy breadsticks with a hint of olive oil.', '2026-05-12', 'Italian Breadsticks 125g', 0, 5.0, 140, 'buc', 57, 1),

-- Pastry (Croissants, Muffins, Sweet doughs)
(309, 'Large buttery croissant, perfect for a French breakfast.', '2026-03-02', 'Butter Croissant 65g', 0, 3.0, 95, 'buc', 57, 7),
(310, 'Soft Italian sponge cake filled with chocolate cream.', '2026-04-15', 'Chocolate Mini Cake 50g', 0, 2.5, 200, 'buc', 55, 7),
(311, 'Fluffy muffin loaded with dark chocolate chips.', '2026-03-05', 'Chocolate Chip Muffin 80g', 15, 4.5, 40, 'buc', 57, 7),
(312, 'Traditional Romanian sweet bread (Cozonac) with cocoa and Turkish delight.', '2026-03-12', 'Sweet Bread Cocoa & Turkish Delight 400g', 0, 22.0, 65, 'buc', 51, 7),
(313, 'Soft puff pastry filled with sweet apricot jam.', '2026-03-18', 'Apricot Strudel 85g', 0, 3.8, 110, 'buc', 32, 7),
(314, 'Crispy puff pastry rolls with a delicate vanilla filling.', '2026-04-10', 'Vanilla Pastry Rolls 150g', 0, 9.5, 75, 'buc', 52, 7),
(315, 'Authentic Italian Panettone with raisins and candied fruit.', '2026-05-01', 'Classic Panettone 500g', 0, 35.0, 30, 'buc', 55, 7),
(316, 'Soft mini croissants with cherry filling, pack of 6.', '2026-03-25', 'Mini Cherry Croissants 200g', 0, 8.5, 85, 'buc', 32, 7),

-- Sweets & Snacks (Completing the requested 30-40 items)
(317, 'Roasted and salted peanuts, a classic party snack.', '2026-08-20', 'Salted Peanuts 100g', 0, 4.5, 300, 'buc', 58, 4),
(318, 'Premium roasted pistachios, perfectly salted.', '2026-09-15', 'Roasted Pistachios 150g', 0, 18.5, 120, 'buc', 59, 4),
(319, 'Dark chocolate bar with 70% premium cocoa.', '2026-07-10', 'Dark Chocolate 70% 100g', 0, 8.0, 150, 'buc', 34, 4),
(320, 'Crunchy wafer covered in smooth milk chocolate.', '2026-05-22', 'Chocolate Wafer Bar 35g', 0, 2.5, 400, 'buc', 38, 4),
(321, 'Biscuit sticks dipped in delicious strawberry cream.', '2026-06-18', 'Strawberry Biscuit Sticks 45g', 0, 4.0, 210, 'buc', 39, 4),
(322, 'Gummy bears with natural fruit juices.', '2026-10-30', 'Fruit Gummy Bears 100g', 0, 5.5, 250, 'buc', 54, 4),
(323, 'Crispy corn tortilla chips with a spicy nacho cheese flavor.', '2026-04-05', 'Nacho Cheese Tortilla 150g', 22, 9.0, 22, 'buc', 31, 4),
(324, 'Sweet and crunchy caramel popcorn.', '2026-05-11', 'Caramel Popcorn 90g', 0, 6.5, 130, 'buc', 58, 4),
(325, 'Soft and chewy marshmallows in various fruit flavors.', '2026-08-08', 'Fruit Marshmallows 150g', 0, 7.5, 115, 'buc', 54, 4),
(326, 'Rich chocolate truffles with a smooth melting center.', '2026-06-25', 'Chocolate Truffles 200g', 0, 28.0, 60, 'buc', 34, 4),

-- Coffee/Tea (Beverages)
(327, 'Premium roasted coffee beans, 100% Arabica.', '2026-11-20', 'Espresso Coffee Beans 500g', 0, 42.0, 90, 'buc', 60, 2),
(328, 'Instant coffee granules for a quick morning boost.', '2027-02-14', 'Gold Instant Coffee 100g', 0, 25.0, 140, 'buc', 60, 2),
(329, 'Green tea bags with a delicate jasmine aroma.', '2026-12-05', 'Jasmine Green Tea 20x2g', 0, 9.5, 200, 'buc', 27, 2),
(330, 'Classic black tea, robust and full-bodied.', '2026-12-10', 'English Breakfast Tea 20x2g', 0, 8.5, 180, 'buc', 27, 2);


-- Update Sequence
SELECT setval(pg_get_serial_sequence('public.product', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM public.product;

COMMIT;