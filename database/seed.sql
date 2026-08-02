-- ============================================================
-- Test password for all users: Password123
-- Bcrypt hash: $2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO
-- ============================================================

SET NOCOUNT ON;
GO

-- Disable all FK constraints so we can truncate/re-seed safely.
EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

-- Truncate in reverse dependency order.
IF OBJECT_ID('dbo.OrderStatusLog', 'U') IS NOT NULL DELETE FROM dbo.OrderStatusLog;
IF OBJECT_ID('dbo.CartItem', 'U') IS NOT NULL DELETE FROM dbo.CartItem;
IF OBJECT_ID('dbo.Cart', 'U') IS NOT NULL DELETE FROM dbo.Cart;
IF OBJECT_ID('dbo.VendorProfile', 'U') IS NOT NULL DELETE FROM dbo.VendorProfile;
IF OBJECT_ID('dbo.CustomerProfile', 'U') IS NOT NULL DELETE FROM dbo.CustomerProfile;
IF OBJECT_ID('dbo.Promotion', 'U') IS NOT NULL DELETE FROM dbo.Promotion;
IF OBJECT_ID('dbo.HygieneGrade', 'U') IS NOT NULL DELETE FROM dbo.HygieneGrade;
IF OBJECT_ID('dbo.Inspection', 'U') IS NOT NULL DELETE FROM dbo.Inspection;
IF OBJECT_ID('dbo.Notification', 'U') IS NOT NULL DELETE FROM dbo.Notification;
IF OBJECT_ID('dbo.QueueEntry', 'U') IS NOT NULL DELETE FROM dbo.QueueEntry;
IF OBJECT_ID('dbo.Complaint', 'U') IS NOT NULL DELETE FROM dbo.Complaint;
IF OBJECT_ID('dbo.Likes', 'U') IS NOT NULL DELETE FROM dbo.Likes;
IF OBJECT_ID('dbo.Feedback', 'U') IS NOT NULL DELETE FROM dbo.Feedback;
IF OBJECT_ID('dbo.OrderItem', 'U') IS NOT NULL DELETE FROM dbo.OrderItem;
IF OBJECT_ID('dbo.[Order]', 'U') IS NOT NULL DELETE FROM dbo.[Order];
IF OBJECT_ID('dbo.RentalAgreement', 'U') IS NOT NULL DELETE FROM dbo.RentalAgreement;
IF OBJECT_ID('dbo.MenuItemCuisine', 'U') IS NOT NULL DELETE FROM dbo.MenuItemCuisine;
IF OBJECT_ID('dbo.MenuItem', 'U') IS NOT NULL DELETE FROM dbo.MenuItem;
IF OBJECT_ID('dbo.Stall', 'U') IS NOT NULL DELETE FROM dbo.Stall;
IF OBJECT_ID('dbo.[User]', 'U') IS NOT NULL DELETE FROM dbo.[User];
IF OBJECT_ID('dbo.Cuisine', 'U') IS NOT NULL DELETE FROM dbo.Cuisine;
IF OBJECT_ID('dbo.HawkerCentre', 'U') IS NOT NULL DELETE FROM dbo.HawkerCentre;
GO

-- Reset IDENTITY counters.
DBCC CHECKIDENT('dbo.HawkerCentre', RESEED, 0);
DBCC CHECKIDENT('dbo.Cuisine', RESEED, 0);
DBCC CHECKIDENT('dbo.[User]', RESEED, 0);
DBCC CHECKIDENT('dbo.Stall', RESEED, 0);
DBCC CHECKIDENT('dbo.MenuItem', RESEED, 0);
DBCC CHECKIDENT('dbo.MenuItemCuisine', RESEED, 0);
DBCC CHECKIDENT('dbo.RentalAgreement', RESEED, 0);
DBCC CHECKIDENT('dbo.[Order]', RESEED, 0);
DBCC CHECKIDENT('dbo.OrderItem', RESEED, 0);
DBCC CHECKIDENT('dbo.Feedback', RESEED, 0);
DBCC CHECKIDENT('dbo.Likes', RESEED, 0);
DBCC CHECKIDENT('dbo.Complaint', RESEED, 0);
DBCC CHECKIDENT('dbo.QueueEntry', RESEED, 0);
DBCC CHECKIDENT('dbo.Notification', RESEED, 0);
DBCC CHECKIDENT('dbo.Inspection', RESEED, 0);
DBCC CHECKIDENT('dbo.HygieneGrade', RESEED, 0);
DBCC CHECKIDENT('dbo.Promotion', RESEED, 0);
DBCC CHECKIDENT('dbo.CustomerProfile', RESEED, 0);
DBCC CHECKIDENT('dbo.VendorProfile', RESEED, 0);
DBCC CHECKIDENT('dbo.Cart', RESEED, 0);
DBCC CHECKIDENT('dbo.CartItem', RESEED, 0);
DBCC CHECKIDENT('dbo.OrderStatusLog', RESEED, 0);
GO

-- ============================================================
-- 1. HawkerCentre
-- ============================================================
SET IDENTITY_INSERT dbo.HawkerCentre ON;
INSERT INTO dbo.HawkerCentre (HawkerCentreId, Name, Address, OperatorName) VALUES
  (1, N'Maxwell Food Centre', N'1 Maxwell Rd, Singapore 069192', N'National Environment Agency');
SET IDENTITY_INSERT dbo.HawkerCentre OFF;
GO

-- ============================================================
-- 2. Cuisine
-- ============================================================
SET IDENTITY_INSERT dbo.Cuisine ON;
INSERT INTO dbo.Cuisine (CuisineId, Name) VALUES
  (1, N'Chinese'),
  (2, N'Malay'),
  (3, N'Indian'),
  (4, N'Peranakan'),
  (5, N'Western'),
  (6, N'Muslim');
SET IDENTITY_INSERT dbo.Cuisine OFF;
GO

-- ============================================================
-- 3. [User]  — All passwords = "Password123"
-- Hash: $2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO
-- ============================================================
SET IDENTITY_INSERT dbo.[User] ON;
INSERT INTO dbo.[User] (UserId, Email, PasswordHash, FullName, Role) VALUES
  (1, N'customer1@test.com', N'$2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO', N'Alice Tan',  N'Customer'),
  (2, N'customer2@test.com', N'$2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO', N'Bob Lim',    N'Customer'),
  (3, N'vendor1@test.com',   N'$2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO', N'Uncle Chen', N'Vendor'),
  (4, N'vendor2@test.com',   N'$2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO', N'Auntie Kamala', N'Vendor'),
  (5, N'vendor3@test.com',   N'$2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO', N'Mr Rahman', N'Vendor'),
  (6, N'nea1@test.com',      N'$2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO', N'Officer Wong', N'NEAOfficer'),
  (7, N'operator1@test.com', N'$2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO', N'Ms Ng', N'Operator'),
  (8, N'customer3@test.com', N'$2b$10$cXsF5wcD4pWcDtEqu1zwi.BVmFR3QKK0zN0yrXHQWYBeyek05nyyO', N'Charlie Goh', N'Customer');
SET IDENTITY_INSERT dbo.[User] OFF;
GO

-- ============================================================
-- 4. Stall
-- ============================================================
SET IDENTITY_INSERT dbo.Stall ON;
INSERT INTO dbo.Stall (StallId, HawkerCentreId, OwnerId, Name, Description, UnitNumber, ImageUrl, Status) VALUES
  (1, 1, 3, N'Chen''s Hainan Chicken', N'Authentic Hainanese chicken rice, poached in old-school ginger broth.', N'#01-10', N'https://rasamalaysia.com/wp-content/uploads/2024/11/chicken-rice-thumb-500x500.jpg', N'Active'),
  (2, 1, 4, N'Kamala''s Banana Leaf', N'Fragrant South Indian rice sets served on a banana leaf.', N'#01-22', N'https://images.travelandleisureasia.com/wp-content/uploads/sites/3/2025/01/22203559/Leaf-rice-1600x900.jpg', N'Active'),
  (3, 1, 5, N'Rahman''s Satay', N'Grilled over charcoal, served with peanut sauce and ketupat.', N'#01-45', N'https://www.ezbbq.com.sg/cdn/shop/products/GrilledChickenSataySet.jpg', N'Active');
SET IDENTITY_INSERT dbo.Stall OFF;
GO

-- ============================================================
-- 5. MenuItem — 5 per stall (15 total)
-- ============================================================
SET IDENTITY_INSERT dbo.MenuItem ON;
-- Stall 1 — Hainan Chicken
INSERT INTO dbo.MenuItem (MenuItemId, StallId, Name, Description, Price, Category, IsAvailable) VALUES
  (1,  1, N'Roast Chicken Rice',    N'Tender roast chicken over fragrant rice.',                5.50, N'Main',  1),
  (2,  1, N'Steamed Chicken Rice',  N'Classic poached chicken with light soy.',                  5.00, N'Main',  1),
  (3,  1, N'Chicken Soup',          N'Comforting clear broth with celery and tofu.',             3.00, N'Side',  1),
  (4,  1, N'Barley Lime Drink',     N'Cold, sweet, slightly bitter — the perfect chiller.',      2.00, N'Drink', 1),
  (5,  1, N'Cendol Pudding',        N'Pandan jelly with coconut milk and palm sugar.',           2.50, N'Dessert',1);
-- Stall 2 — Banana Leaf
INSERT INTO dbo.MenuItem (MenuItemId, StallId, Name, Description, Price, Category, IsAvailable) VALUES
  (6,  2, N'Fish Head Curry',       N'Spicy South Indian fish head curry with okra.',           12.00, N'Main',  1),
  (7,  2, N'Chicken Varuval',       N'Marinated chicken dry-fried with aromatic spices.',        8.00,  N'Main',  1),
  (8,  2, N'Vegetable Thali Set',   N'Rice with four vegetables, papadum, and dhal.',            7.00,  N'Main',  1),
  (9,  2, N'Mango Lassi',           N'Chilled yogurt drink blended with Alphonso mango.',        3.50,  N'Drink', 1),
  (10, 2, N'Papadum Basket',        N'Crispy lentil crackers to start your meal.',               1.50,  N'Snack', 1);
-- Stall 3 — Satay
INSERT INTO dbo.MenuItem (MenuItemId, StallId, Name, Description, Price, Category, IsAvailable) VALUES
  (11, 3, N'Chicken Satay (10)',    N'Ten skewers of marinated chicken over charcoal.',          10.00, N'Main',  1),
  (12, 3, N'Beef Satay (10)',       N'Ten skewers of marinated beef over charcoal.',             12.00, N'Main',  1),
  (13, 3, N'Ketupat',               N'Compressed rice cakes — perfect with satay.',              1.00, N'Side',  1),
  (14, 3, N'Teh Tarik',             N'Pulled milk tea, frothy and sweet.',                       2.50, N'Drink', 1),
  (15, 3, N'Pisang Goreng',         N'Crispy fried banana fritters with palm sugar.',            3.00, N'Dessert',1);
SET IDENTITY_INSERT dbo.MenuItem OFF;
GO

-- ============================================================
-- 6. MenuItemCuisine — 10 links
-- ============================================================
SET IDENTITY_INSERT dbo.MenuItemCuisine ON;
INSERT INTO dbo.MenuItemCuisine (MenuItemCuisineId, MenuItemId, CuisineId) VALUES
  (1,  1,  1), -- Roast Chicken   -> Chinese
  (2,  2,  1), -- Steamed Chicken -> Chinese
  (3,  5,  4), -- Cendol          -> Peranakan
  (4,  6,  3), -- Fish Head Curry -> Indian
  (5,  7,  3), -- Chicken Varuval -> Indian
  (6,  8,  3), -- Vegetable Thali -> Indian
  (7,  9,  3), -- Mango Lassi     -> Indian
  (8, 11,  6), -- Chicken Satay   -> Muslim (Malay)
  (9, 12,  6), -- Beef Satay      -> Muslim
  (10,14,  2); -- Teh Tarik       -> Malay
SET IDENTITY_INSERT dbo.MenuItemCuisine OFF;
GO

-- ============================================================
-- 7. RentalAgreement
-- ============================================================
SET IDENTITY_INSERT dbo.RentalAgreement ON;
INSERT INTO dbo.RentalAgreement (RentalAgreementId, StallId, MonthlyRent, StartDate, EndDate, Status, Terms) VALUES
  (1, 1, 1500.00, '2024-01-01', '2026-12-31', N'Active', N'Standard NEA hawker rental terms.'),
  (2, 2, 1800.00, '2024-03-15', '2026-03-14', N'Active', N'Includes shared utilities.'),
  (3, 3, 1600.00, '2024-06-01', '2026-05-31', N'Active', N'Standard NEA hawker rental terms.');
SET IDENTITY_INSERT dbo.RentalAgreement OFF;
GO

-- ============================================================
-- 8. [Order] — 5 orders of various statuses
-- ============================================================
SET IDENTITY_INSERT dbo.[Order] ON;
INSERT INTO dbo.[Order] (OrderId, StallId, CustomerId, GuestName, OrderDate, Status, TotalAmount, PaymentStatus, SpecialInstructions) VALUES
  (1, 1, 1, NULL, '2026-01-15 11:30:00', N'Pending',    7.50,  N'Paid',  N'Less chili please.'),
  (2, 2, 2, NULL, '2026-01-15 12:15:00', N'Preparing',  15.00, N'Paid',  NULL),
  (3, 3, 1, NULL, '2026-01-14 19:00:00', N'Ready',      13.00, N'Paid',  N'Extra peanut sauce.'),
  (4, 1, 8, NULL, '2026-01-13 12:45:00', N'Completed',  10.50, N'Paid',  NULL),
  (5, 2, 1, NULL, '2026-01-12 13:00:00', N'Completed',  22.00, N'Paid',  N'Not too spicy.');
SET IDENTITY_INSERT dbo.[Order] OFF;
GO

-- ============================================================
-- 9. OrderItem — ~12 rows
-- ============================================================
SET IDENTITY_INSERT dbo.OrderItem ON;
INSERT INTO dbo.OrderItem (OrderItemId, OrderId, MenuItemId, Quantity, UnitPrice, AddOns, AddOnCharge) VALUES
  (1,  1, 1,  1, 5.50,  N'Extra chicken',  2.00),
  (2,  1, 4,  1, 2.00,  NULL,              0.00),
  (3,  2, 6,  1, 12.00, N'Extra okra',     0.00),
  (4,  2, 9,  1, 3.00,  NULL,              0.00),
  (5,  3, 11, 1, 10.00, NULL,              1.00),
  (6,  3, 13, 3, 1.00,  NULL,              0.00),
  (7,  4, 1,  1, 5.50,  NULL,              0.00),
  (8,  4, 2,  1, 5.00,  NULL,              0.00),
  (9,  5, 6,  1, 12.00, NULL,              0.00),
  (10, 5, 7,  1, 8.00,  NULL,              0.00),
  (11, 5, 9,  1, 3.50,  NULL,              0.00),
  (12, 5, 10, 1, 1.50,  NULL,              0.00);
SET IDENTITY_INSERT dbo.OrderItem OFF;
GO

-- ============================================================
-- 10. OrderStatusLog — ~15 history rows
-- ============================================================
SET IDENTITY_INSERT dbo.OrderStatusLog ON;
-- Order 1 (Pending)
INSERT INTO dbo.OrderStatusLog (LogId, OrderId, Status, ChangedAt, ChangedBy) VALUES
  (1, 1, N'Pending',    '2026-01-15 11:30:00', 1),
-- Order 2 (Preparing)
  (2, 2, N'Pending',    '2026-01-15 12:15:00', 2),
  (3, 2, N'Preparing',  '2026-01-15 12:25:00', 4),
-- Order 3 (Ready)
  (4, 3, N'Pending',    '2026-01-14 19:00:00', 1),
  (5, 3, N'Preparing',  '2026-01-14 19:10:00', 5),
  (6, 3, N'Ready',      '2026-01-14 19:25:00', 5),
-- Order 4 (Completed)
  (7, 4, N'Pending',    '2026-01-13 12:45:00', 8),
  (8, 4, N'Preparing',  '2026-01-13 12:50:00', 3),
  (9, 4, N'Ready',      '2026-01-13 13:05:00', 3),
  (10,4, N'Completed',  '2026-01-13 13:15:00', 3),
-- Order 5 (Completed)
  (11,5, N'Pending',    '2026-01-12 13:00:00', 1),
  (12,5, N'Preparing',  '2026-01-12 13:10:00', 4),
  (13,5, N'Ready',      '2026-01-12 13:30:00', 4),
  (14,5, N'Completed',  '2026-01-12 13:45:00', 4),
  (15,1, N'Preparing',  '2026-01-15 11:45:00', 3);
SET IDENTITY_INSERT dbo.OrderStatusLog OFF;
GO

-- ============================================================
-- 11. Feedback
-- ============================================================
SET IDENTITY_INSERT dbo.Feedback ON;
INSERT INTO dbo.Feedback (FeedbackId, StallId, CustomerId, Rating, Comment) VALUES
  (1, 1, 1, 5, N'Best chicken rice in town! Springy chicken, fragrant rice.'),
  (2, 1, 2, 4, N'Good but a bit salty today.'),
  (3, 2, 1, 5, N'Fish head curry was incredible, will be back.'),
  (4, 3, 8, 3, N'Satay was good but the queue was long.');
SET IDENTITY_INSERT dbo.Feedback OFF;
GO

-- ============================================================
-- 12. Likes
-- ============================================================
SET IDENTITY_INSERT dbo.Likes ON;
INSERT INTO dbo.Likes (LikeId, MenuItemId, CustomerId) VALUES
  (1, 1,  1),
  (2, 5,  1),
  (3, 6,  2),
  (4, 11, 8),
  (5, 14, 8),
  (6, 9,  1);
SET IDENTITY_INSERT dbo.Likes OFF;
GO

-- ============================================================
-- 13. Complaint
-- ============================================================
SET IDENTITY_INSERT dbo.Complaint ON;
INSERT INTO dbo.Complaint (ComplaintId, StallId, CustomerId, Subject, Description, Status) VALUES
  (1, 1, 2, N'Long wait time',     N'Waited 40 minutes for a $5 plate. Please add more staff.', N'Open'),
  (2, 3, 1, N'Foreign object',     N'Found a small piece of plastic in the peanut sauce.',       N'Investigating');
SET IDENTITY_INSERT dbo.Complaint OFF;
GO

-- ============================================================
-- 14. QueueEntry — 3 entries for Stall 1
-- ============================================================
SET IDENTITY_INSERT dbo.QueueEntry ON;
INSERT INTO dbo.QueueEntry (QueueEntryId, StallId, CustomerId, QueueNumber, Status, JoinedAt) VALUES
  (1, 1, 1, 12, N'Waiting', '2026-01-20 12:05:00'),
  (2, 1, 2, 13, N'Waiting', '2026-01-20 12:10:00'),
  (3, 1, 8, 14, N'Served',  '2026-01-20 11:30:00');
SET IDENTITY_INSERT dbo.QueueEntry OFF;
GO

-- ============================================================
-- 15. Notification
-- ============================================================
SET IDENTITY_INSERT dbo.Notification ON;
INSERT INTO dbo.Notification (NotificationId, UserId, Title, Message, Type, IsRead) VALUES
  (1, 1, N'Order Ready',         N'Your order #3 is ready for pickup.',                        N'Order',     0),
  (2, 1, N'Promotion',           N'10% off all items at Chen''s Hainan Chicken today!',        N'Promotion', 0),
  (3, 2, N'Inspection Scheduled',N'NEA inspection at Maxwell tomorrow at 10am.',               N'Inspection',1),
  (4, 3, N'New Feedback',        N'You received a 5-star review from Alice Tan.',              N'Feedback',  0),
  (5, 6, N'Inspection Due',      N'3 stalls at Maxwell are due for inspection.',                N'Inspection',0);
SET IDENTITY_INSERT dbo.Notification OFF;
GO

-- ============================================================
-- 16. Inspection — 1 per stall
-- ============================================================
SET IDENTITY_INSERT dbo.Inspection ON;
INSERT INTO dbo.Inspection (InspectionId, StallId, OfficerId, InspectionDate, Score, Remarks, GradeIssued) VALUES
  (1, 1, 6, '2026-01-10', 92.00, N'Excellent hygiene standards.',         N'A'),
  (2, 2, 6, '2026-01-11', 78.50, N'Good but improve pest control.',       N'B'),
  (3, 3, 6, '2026-01-12', 65.00, N'Several minor issues. Follow up soon.',N'C');
SET IDENTITY_INSERT dbo.Inspection OFF;
GO

-- ============================================================
-- 17. HygieneGrade — stall 1 has 2 historical, others 1 each
-- ============================================================
SET IDENTITY_INSERT dbo.HygieneGrade ON;
INSERT INTO dbo.HygieneGrade (HygieneGradeId, StallId, Grade, IssuedDate, ExpiryDate, InspectionId) VALUES
  (1, 1, N'A', '2025-01-10', '2026-01-09', NULL),
  (2, 1, N'A', '2026-01-10', '2027-01-09', 1),
  (3, 2, N'B', '2026-01-11', '2027-01-10', 2),
  (4, 3, N'C', '2026-01-12', '2027-01-11', 3);
SET IDENTITY_INSERT dbo.HygieneGrade OFF;
GO

-- ============================================================
-- 18. Promotion
-- ============================================================
SET IDENTITY_INSERT dbo.Promotion ON;
INSERT INTO dbo.Promotion (PromotionId, StallId, Title, Description, DiscountType, DiscountValue, StartDate, EndDate, IsActive) VALUES
  (1, 1, N'Lunch Set Deal',    N'Chicken rice + drink combo.',      N'Percentage', 10.00, '2026-01-01', '2026-03-31', 1),
  (2, 2, N'Free Papadum',      N'Free papadum basket with any main.',N'Fixed',     1.50,  '2026-01-01', '2026-02-28', 1),
  (3, 3, N'10 Skewer Special', N'Buy 10 satay get $2 off.',          N'Fixed',     2.00,  '2026-01-15', '2026-04-15', 1);
SET IDENTITY_INSERT dbo.Promotion OFF;
GO

-- ============================================================
-- 19. CustomerProfile
-- ============================================================
SET IDENTITY_INSERT dbo.CustomerProfile ON;
INSERT INTO dbo.CustomerProfile (CustomerProfileId, UserId, LoyaltyPoints, Phone, PreferredLanguage) VALUES
  (1, 1, 150, N'+65 8123 4567', N'en'),
  (2, 2, 60,  N'+65 8234 5678', N'en'),
  (3, 8, 220, N'+65 8345 6789', N'en');
SET IDENTITY_INSERT dbo.CustomerProfile OFF;
GO

-- ============================================================
-- 20. VendorProfile
-- ============================================================
SET IDENTITY_INSERT dbo.VendorProfile ON;
INSERT INTO dbo.VendorProfile (VendorProfileId, UserId, BusinessName, ContactNumber, StallId) VALUES
  (1, 3, N'Chen''s Hainan Chicken Pte Ltd', N'+65 9111 1111', 1),
  (2, 4, N'Kamala''s Kitchen',              N'+65 9222 2222', 2),
  (3, 5, N'Rahman Satay Trading',           N'+65 9333 3333', 3);
SET IDENTITY_INSERT dbo.VendorProfile OFF;
GO

-- ============================================================
-- 21. Cart — customer1 has a cart for stall 1
-- ============================================================
SET IDENTITY_INSERT dbo.Cart ON;
INSERT INTO dbo.Cart (CartId, CustomerId, SessionId, StallId) VALUES
  (1, 1, NULL, 1);
SET IDENTITY_INSERT dbo.Cart OFF;
GO

-- ============================================================
-- 22. CartItem — 2 items in that cart
-- ============================================================
SET IDENTITY_INSERT dbo.CartItem ON;
INSERT INTO dbo.CartItem (CartItemId, CartId, MenuItemId, Quantity, AddOns, AddOnCharge) VALUES
  (1, 1, 1, 2, N'Extra chicken', 2.00),
  (2, 1, 4, 1, NULL,             0.00);
SET IDENTITY_INSERT dbo.CartItem OFF;
GO

-- Re-enable FK constraints.
EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

PRINT '✅ SHCMS seed data inserted successfully.';
PRINT '   Test accounts (password: Password123):';
PRINT '   - customer1@test.com (Customer)';
PRINT '   - vendor1@test.com   (Vendor)';
PRINT '   - nea1@test.com      (NEAOfficer)';
PRINT '   - operator1@test.com (Operator)';
GO
