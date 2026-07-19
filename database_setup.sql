/* Run this script in SSMS.  dbconfig.js is assumed to point at HawkerCentreMS. */
IF DB_ID('HawkerCentreMS') IS NULL CREATE DATABASE HawkerCentreMS;
GO
USE HawkerCentreMS;
GO
IF OBJECT_ID('dbo.OrderItems', 'U') IS NOT NULL DROP TABLE dbo.OrderItems;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Carts', 'U') IS NOT NULL DROP TABLE dbo.Carts;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO
CREATE TABLE dbo.Users (
  UserId INT IDENTITY PRIMARY KEY, FullName NVARCHAR(100) NOT NULL, Email NVARCHAR(120) NOT NULL UNIQUE,
  PasswordHash VARCHAR(64) NOT NULL, Role VARCHAR(15) NOT NULL CHECK (Role IN ('patron','vendor','nea_officer')),
  IsActive BIT NOT NULL DEFAULT 1, CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
CREATE TABLE dbo.Products (
  ProductId INT IDENTITY PRIMARY KEY, ProductName NVARCHAR(120) NOT NULL, Description NVARCHAR(300) NOT NULL,
  StallName NVARCHAR(120) NOT NULL, Price DECIMAL(10,2) NOT NULL CHECK (Price >= 0), Emoji NVARCHAR(10) NOT NULL,
  Colour VARCHAR(20) NOT NULL, IsAvailable BIT NOT NULL DEFAULT 1
);
CREATE TABLE dbo.Carts (
  CartId INT IDENTITY PRIMARY KEY, UserId INT NOT NULL UNIQUE REFERENCES dbo.Users(UserId),
  CartItemsJson NVARCHAR(MAX) NOT NULL DEFAULT N'[]', UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT CK_Carts_ItemsJson CHECK (ISJSON(CartItemsJson) = 1)
);
CREATE TABLE dbo.Orders (
  OrderId INT IDENTITY(1000,1) PRIMARY KEY, UserId INT NOT NULL REFERENCES dbo.Users(UserId),
  OrderDate DATETIME2 NOT NULL DEFAULT SYSDATETIME(), TotalAmount DECIMAL(10,2) NOT NULL, DeliveryAddress NVARCHAR(250) NULL,
  Status VARCHAR(20) NOT NULL DEFAULT 'Preparing'
);
CREATE TABLE dbo.OrderItems (
  OrderItemId INT IDENTITY PRIMARY KEY, OrderId INT NOT NULL REFERENCES dbo.Orders(OrderId),
  ProductId INT NOT NULL REFERENCES dbo.Products(ProductId), Quantity INT NOT NULL CHECK (Quantity > 0), UnitPrice DECIMAL(10,2) NOT NULL
);
GO
-- All sample passwords are Password123! (SHA-256; use bcrypt in production).
INSERT dbo.Users (FullName,Email,PasswordHash,Role) VALUES
('Jamie Sim','jamie.sim@email.com',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','Password123!'),2),'patron'),
('Aisha Rahman','aisha@stall.com',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','Password123!'),2),'vendor'),
('Daniel Tan','daniel@nea.gov.sg',CONVERT(VARCHAR(64),HASHBYTES('SHA2_256','Password123!'),2),'nea_officer');
INSERT dbo.Products (ProductName,Description,StallName,Price,Emoji,Colour) VALUES
(N'Hainanese Chicken Rice',N'Poached chicken, fragrant rice and house-made chilli.',N'Stall #03 · Signature Poultry',5.50,N'🍗','orange'),
(N'Premium Nasi Lemak',N'Coconut rice with sambal, anchovies, egg and chicken wing.',N'Stall #08 · Traditional Malay',6.50,N'🍛','yellow'),
(N'Char Kway Teow',N'Smoky wok-fried noodles with egg, prawns and cockles.',N'Stall #12 · Wok Classics',5.00,N'🍜','red');
INSERT dbo.Orders (UserId,TotalAmount,DeliveryAddress,Status) VALUES (1,6.50,N'21 Tampines Street 45, #08-120','Delivered');
INSERT dbo.OrderItems (OrderId,ProductId,Quantity,UnitPrice) VALUES (1000,3,1,5.00);
GO
SELECT * FROM HawkerCentreMS.dbo.Products; 