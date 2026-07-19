/*
  Run this script in SSMS after database_setup.sql.
  It preserves the existing Products table and raises the seeded menu from
  3 to 20 items by adding a Cuisine classification and 17 new products.
*/
USE HawkerCentreMS;
GO

IF COL_LENGTH('dbo.Products', 'Cuisine') IS NULL
BEGIN
  ALTER TABLE dbo.Products ADD Cuisine NVARCHAR(50) NULL;
END;
GO

/* Classify the three products already inserted by database_setup.sql. */
UPDATE dbo.Products
SET Cuisine = CASE ProductName
  WHEN N'Hainanese Chicken Rice' THEN N'Chinese'
  WHEN N'Premium Nasi Lemak' THEN N'Malay'
  WHEN N'Char Kway Teow' THEN N'Chinese'
END
WHERE ProductName IN (N'Hainanese Chicken Rice', N'Premium Nasi Lemak', N'Char Kway Teow')
  AND (Cuisine IS NULL OR Cuisine = N'');
GO

/* INSERT ... SELECT keeps the migration safe to run more than once. */
INSERT dbo.Products (ProductName, Description, StallName, Price, Emoji, Colour, Cuisine)
SELECT menu.ProductName, menu.Description, menu.StallName, menu.Price, menu.Emoji, menu.Colour, menu.Cuisine
FROM (VALUES
  (N'Laksa', N'Spicy coconut curry noodles with prawns, fishcake and tofu puff.', N'Stall #05 - Katong Classics', CAST(5.80 AS DECIMAL(10,2)), N'🍜', 'orange', N'Peranakan'),
  (N'Bak Chor Mee', N'Minced pork noodles tossed in a savoury vinegar sauce.', N'Stall #09 - Teochew Noodles', CAST(4.80 AS DECIMAL(10,2)), N'🍝', 'red', N'Chinese'),
  (N'Fishball Noodle Soup', N'Yellow noodles in a light broth with handmade fishballs.', N'Stall #10 - Ocean Bowl', CAST(4.50 AS DECIMAL(10,2)), N'🍲', 'blue', N'Chinese'),
  (N'Beef Rendang Rice', N'Tender beef slow-cooked in aromatic coconut spices.', N'Stall #14 - Warisan Melayu', CAST(7.20 AS DECIMAL(10,2)), N'🍛', 'brown', N'Malay'),
  (N'Mee Rebus', N'Egg noodles in a rich sweet potato gravy with egg and lime.', N'Stall #15 - Selera Kampung', CAST(4.50 AS DECIMAL(10,2)), N'🥣', 'yellow', N'Malay'),
  (N'Roti Prata Egg', N'Crisp pan-fried flatbread served with a fluffy egg and curry.', N'Stall #18 - Prata House', CAST(2.80 AS DECIMAL(10,2)), N'🫓', 'yellow', N'Indian'),
  (N'Masala Thosai', N'Crisp fermented rice crepe filled with spiced potato masala.', N'Stall #19 - South Indian Delights', CAST(4.20 AS DECIMAL(10,2)), N'🥞', 'orange', N'Indian'),
  (N'Mutton Briyani', N'Fragrant basmati rice served with tender curried mutton.', N'Stall #20 - Spice Junction', CAST(7.50 AS DECIMAL(10,2)), N'🍚', 'red', N'Indian'),
  (N'Japanese Chicken Katsu Don', N'Breaded chicken cutlet over rice with egg and savoury sauce.', N'Stall #22 - Tokyo Bento', CAST(6.80 AS DECIMAL(10,2)), N'🍱', 'red', N'Japanese'),
  (N'Salmon Teriyaki Bowl', N'Grilled salmon with teriyaki glaze, rice and seasonal greens.', N'Stall #23 - Sakura Grill', CAST(8.90 AS DECIMAL(10,2)), N'🍣', 'pink', N'Japanese'),
  (N'Korean Bibimbap', N'Rice bowl with vegetables, egg, gochujang and bulgogi beef.', N'Stall #25 - Seoul Kitchen', CAST(7.80 AS DECIMAL(10,2)), N'🍚', 'red', N'Korean'),
  (N'Kimchi Fried Rice', N'Wok-fried rice with kimchi, egg and sesame.', N'Stall #26 - Kimchi House', CAST(6.20 AS DECIMAL(10,2)), N'🍳', 'orange', N'Korean'),
  (N'Vietnamese Beef Pho', N'Rice noodles in aromatic beef broth with fresh herbs.', N'Stall #28 - Saigon Street', CAST(7.00 AS DECIMAL(10,2)), N'🍜', 'green', N'Vietnamese'),
  (N'Thai Basil Chicken Rice', N'Spicy basil chicken with jasmine rice and a fried egg.', N'Stall #30 - Thai Express', CAST(6.50 AS DECIMAL(10,2)), N'🍛', 'green', N'Thai'),
  (N'Pad Thai', N'Stir-fried rice noodles with prawns, tofu and crushed peanuts.', N'Stall #31 - Bangkok Wok', CAST(6.80 AS DECIMAL(10,2)), N'🍝', 'orange', N'Thai'),
  (N'Grilled Chicken Wrap', N'Herb-grilled chicken with vegetables in a warm tortilla.', N'Stall #33 - Urban Bites', CAST(6.00 AS DECIMAL(10,2)), N'🌯', 'green', N'Western'),
  (N'Mushroom Carbonara', N'Creamy pasta with sauteed mushrooms and parmesan.', N'Stall #34 - Pasta Corner', CAST(6.90 AS DECIMAL(10,2)), N'🍝', 'cream', N'Western')
) AS menu (ProductName, Description, StallName, Price, Emoji, Colour, Cuisine)
WHERE NOT EXISTS (
  SELECT 1 FROM dbo.Products AS product
  WHERE product.ProductName = menu.ProductName
);
GO

/* Expected result after database_setup.sql plus this migration: 20 menu items. */
SELECT ProductId, ProductName, Cuisine, StallName, Price
FROM dbo.Products
ORDER BY ProductId;
GO
