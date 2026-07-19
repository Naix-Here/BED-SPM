/* ==========================================================================
   HawkerHub – Order History & Vendor Management Schema
   Run this in SSMS after database_setup.sql has created HawkerCentreMS.
   Adds tables for order feedback, menu management, stalls, rental agreements.
   ========================================================================== */
USE HawkerCentreMS;
GO

-- ==========================================================================
-- EXTEND EXISTING ORDERS TABLE (additive change, does not modify existing columns)
-- Add GuestSessionId for guest order support
-- ==========================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Orders') AND name='GuestSessionId')
  ALTER TABLE dbo.Orders ADD GuestSessionId NVARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('dbo.Orders') AND name='OrderType')
  ALTER TABLE dbo.Orders ADD OrderType VARCHAR(20) DEFAULT 'dine_in';
GO

-- ==========================================================================
-- HAWKER CENTRES
-- ==========================================================================
IF OBJECT_ID('dbo.HawkerCentres', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.HawkerCentres (
    CentreId INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL,
    Address NVARCHAR(500) NOT NULL,
    PostalCode VARCHAR(10),
    OperatingHours VARCHAR(100),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END;
GO

-- ==========================================================================
-- STALLS  (links to existing dbo.Users as owner)
-- ==========================================================================
IF OBJECT_ID('dbo.Stalls', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Stalls (
    StallId INT IDENTITY PRIMARY KEY,
    CentreId INT NOT NULL REFERENCES dbo.HawkerCentres(CentreId),
    OwnerId INT NOT NULL REFERENCES dbo.Users(UserId),
    StallName NVARCHAR(150) NOT NULL,
    StallNumber VARCHAR(20),
    CuisineType NVARCHAR(100),
    Description NVARCHAR(500),
    Status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (Status IN ('active','inactive','suspended')),
    OpeningHours VARCHAR(100),
    ImageUrl VARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END;
GO

-- ==========================================================================
-- CUISINES
-- ==========================================================================
IF OBJECT_ID('dbo.Cuisines', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Cuisines (
    CuisineId INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL UNIQUE
  );
END;
GO

-- ==========================================================================
-- MENU ITEMS  (vendor-facing full-featured menu, distinct from dbo.Products)
-- ==========================================================================
IF OBJECT_ID('dbo.MenuItems', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.MenuItems (
    ItemId INT IDENTITY PRIMARY KEY,
    StallId INT NOT NULL REFERENCES dbo.Stalls(StallId),
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(500),
    Price DECIMAL(8,2) NOT NULL CHECK (Price >= 0),
    Category VARCHAR(20) NOT NULL DEFAULT 'main_dish' CHECK (Category IN ('main_dish','drink','dessert','snack','add_on')),
    ImageUrl VARCHAR(500),
    IsAvailable BIT NOT NULL DEFAULT 1,
    IsPromotion BIT NOT NULL DEFAULT 0,
    PromotionPrice DECIMAL(8,2),
    PromotionStart DATE,
    PromotionEnd DATE,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END;
GO

-- ==========================================================================
-- MENU ITEM <-> CUISINE  (many-to-many)
-- ==========================================================================
IF OBJECT_ID('dbo.MenuItemCuisines', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.MenuItemCuisines (
    ItemId INT NOT NULL REFERENCES dbo.MenuItems(ItemId) ON DELETE CASCADE,
    CuisineId INT NOT NULL REFERENCES dbo.Cuisines(CuisineId) ON DELETE CASCADE,
    PRIMARY KEY (ItemId, CuisineId)
  );
END;
GO

-- ==========================================================================
-- RENTAL AGREEMENTS
-- ==========================================================================
IF OBJECT_ID('dbo.RentalAgreements', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.RentalAgreements (
    AgreementId INT IDENTITY PRIMARY KEY,
    StallId INT NOT NULL REFERENCES dbo.Stalls(StallId),
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    MonthlyRent DECIMAL(10,2) NOT NULL,
    Deposit DECIMAL(10,2),
    Terms NVARCHAR(MAX),
    Status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (Status IN ('active','expired','terminated','pending')),
    SignedDate DATE,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END;
GO

-- ==========================================================================
-- FEEDBACKS  (order reviews — links to existing dbo.Orders & dbo.Users)
-- ==========================================================================
IF OBJECT_ID('dbo.Feedbacks', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Feedbacks (
    FeedbackId INT IDENTITY PRIMARY KEY,
    OrderId INT NOT NULL REFERENCES dbo.Orders(OrderId),
    UserId INT REFERENCES dbo.Users(UserId),
    StallId INT NOT NULL REFERENCES dbo.Stalls(StallId),
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(1000),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
  );
END;
GO

-- ==========================================================================
-- MENU LIKES
-- ==========================================================================
IF OBJECT_ID('dbo.MenuLikes', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.MenuLikes (
    LikeId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL REFERENCES dbo.Users(UserId),
    ItemId INT NOT NULL REFERENCES dbo.MenuItems(ItemId) ON DELETE CASCADE,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_MenuLikes_UserItem UNIQUE (UserId, ItemId)
  );
END;
GO

-- ==========================================================================
-- SAMPLE DATA
-- ==========================================================================

-- Hawker Centres
IF NOT EXISTS (SELECT 1 FROM dbo.HawkerCentres)
BEGIN
  INSERT INTO dbo.HawkerCentres (Name, Address, PostalCode, OperatingHours) VALUES
    (N'Maxwell Food Centre', N'1 Kadayanallur St', '069184', '08:00 – 22:00'),
    (N'Tiong Bahru Market', N'30 Seng Poh Rd', '168898', '07:00 – 23:00');
END;
GO

-- Stalls (linking to existing vendors in dbo.Users)
IF NOT EXISTS (SELECT 1 FROM dbo.Stalls)
BEGIN
  INSERT INTO dbo.Stalls (CentreId, OwnerId, StallName, StallNumber, CuisineType, Description, Status) VALUES
    (1, 2, N'Ah Meng Chicken Rice', '01-23', N'Chinese', N'Famous Hainanese chicken rice since 1985', 'active'),
    (1, 2, N'Ah Meng Noodle House', '01-45', N'Chinese', N'Handmade noodles and dumplings', 'active');
END;
GO

-- Cuisines
IF NOT EXISTS (SELECT 1 FROM dbo.Cuisines)
BEGIN
  INSERT INTO dbo.Cuisines (Name) VALUES
    (N'Chinese'), (N'Malay'), (N'Indian'), (N'Western'), (N'Japanese'), (N'Korean'), (N'Thai');
END;
GO

-- Menu Items
IF NOT EXISTS (SELECT 1 FROM dbo.MenuItems)
BEGIN
  INSERT INTO dbo.MenuItems (StallId, Name, Description, Price, Category, IsAvailable) VALUES
    (1, N'Hainanese Chicken Rice', N'Tender poached chicken with fragrant rice', 4.50, 'main_dish', 1),
    (1, N'Roasted Chicken Rice', N'Crispy roasted chicken with fragrant rice', 5.00, 'main_dish', 1),
    (1, N'Chicken Rice Set', N'Chicken rice + vegetable + drink', 7.00, 'main_dish', 1),
    (1, N'Iced Barley', N'Refreshing cold barley drink', 1.80, 'drink', 1),
    (2, N'Wanton Mee', N'Springy noodles with char siew and wantons', 4.00, 'main_dish', 1),
    (2, N'Dumpling Soup', N'Handmade pork dumplings in clear broth', 5.50, 'main_dish', 1);

  INSERT INTO dbo.MenuItemCuisines (ItemId, CuisineId) VALUES
    (1,1), (2,1), (3,1), (4,1), (5,1), (6,1);
END;
GO

-- Rental Agreements
IF NOT EXISTS (SELECT 1 FROM dbo.RentalAgreements)
BEGIN
  INSERT INTO dbo.RentalAgreements (StallId, StartDate, EndDate, MonthlyRent, Deposit, Status) VALUES
    (1, '2026-01-01', '2026-12-31', 2500.00, 5000.00, 'active'),
    (2, '2026-03-01', '2027-02-28', 1800.00, 3600.00, 'active');
END;
GO

-- Sample feedback for existing orders (dbo.Orders starts at 1000)
IF NOT EXISTS (SELECT 1 FROM dbo.Feedbacks)
BEGIN
  INSERT INTO dbo.Feedbacks (OrderId, UserId, StallId, Rating, Comment) VALUES
    (1000, 1, 1, 5, N'Best chicken rice ever! Very tender and flavorful.'),
    (1000, 1, 1, 4, N'Good value set meal. Chicken was a bit dry today.');
END;
GO
