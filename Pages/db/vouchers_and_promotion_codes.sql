/* ============================================================================
   HawkerHub - Patron Vouchers and Single-Use Promotion Codes
   Run in SSMS after database_setup.sql (and optionally features_schema.sql).

   Voucher eligibility is based on a patron's non-cancelled order count:
   each milestone unlocks the next voucher. A voucher and a promotion code can
   each be redeemed only once by the same patron.
   ============================================================================ */
USE HawkerCentreMS;
GO

IF OBJECT_ID('dbo.Vouchers', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Vouchers (
    VoucherId INT IDENTITY(1,1) PRIMARY KEY,
    VoucherCode VARCHAR(40) NOT NULL,
    VoucherName NVARCHAR(120) NOT NULL,
    RequiredOrderCount INT NOT NULL,
    DiscountType VARCHAR(12) NOT NULL,
    DiscountValue DECIMAL(10,2) NOT NULL,
    MinimumSpend DECIMAL(10,2) NOT NULL DEFAULT 0,
    ValidFrom DATE NOT NULL,
    ValidUntil DATE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_Vouchers_Code UNIQUE (VoucherCode),
    CONSTRAINT UQ_Vouchers_OrderMilestone UNIQUE (RequiredOrderCount),
    CONSTRAINT CK_Vouchers_RequiredOrders CHECK (RequiredOrderCount > 0),
    CONSTRAINT CK_Vouchers_DiscountType CHECK (DiscountType IN ('percentage', 'fixed')),
    CONSTRAINT CK_Vouchers_DiscountValue CHECK (DiscountValue > 0),
    CONSTRAINT CK_Vouchers_MinimumSpend CHECK (MinimumSpend >= 0),
    CONSTRAINT CK_Vouchers_DateRange CHECK (ValidUntil >= ValidFrom)
  );
END;
GO

IF OBJECT_ID('dbo.VoucherRedemptions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.VoucherRedemptions (
    VoucherRedemptionId INT IDENTITY(1,1) PRIMARY KEY,
    VoucherId INT NOT NULL REFERENCES dbo.Vouchers(VoucherId),
    UserId INT NOT NULL REFERENCES dbo.Users(UserId),
    OrderId INT NULL REFERENCES dbo.Orders(OrderId),
    RedeemedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    DiscountApplied DECIMAL(10,2) NULL,
    CONSTRAINT UQ_VoucherRedemptions_UserVoucher UNIQUE (UserId, VoucherId)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.VoucherRedemptions') AND name = 'UX_VoucherRedemptions_Order')
  CREATE UNIQUE INDEX UX_VoucherRedemptions_Order ON dbo.VoucherRedemptions(OrderId) WHERE OrderId IS NOT NULL;
GO

IF OBJECT_ID('dbo.PromotionCodes', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.PromotionCodes (
    PromotionCodeId INT IDENTITY(1,1) PRIMARY KEY,
    Code VARCHAR(40) NOT NULL,
    PromotionName NVARCHAR(120) NOT NULL,
    DiscountType VARCHAR(12) NOT NULL,
    DiscountValue DECIMAL(10,2) NOT NULL,
    MinimumSpend DECIMAL(10,2) NOT NULL DEFAULT 0,
    ValidFrom DATE NOT NULL,
    ValidUntil DATE NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_PromotionCodes_Code UNIQUE (Code),
    CONSTRAINT CK_PromotionCodes_DiscountType CHECK (DiscountType IN ('percentage', 'fixed')),
    CONSTRAINT CK_PromotionCodes_DiscountValue CHECK (DiscountValue > 0),
    CONSTRAINT CK_PromotionCodes_MinimumSpend CHECK (MinimumSpend >= 0),
    CONSTRAINT CK_PromotionCodes_DateRange CHECK (ValidUntil >= ValidFrom)
  );
END;
GO

IF OBJECT_ID('dbo.PromotionCodeRedemptions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.PromotionCodeRedemptions (
    PromotionCodeRedemptionId INT IDENTITY(1,1) PRIMARY KEY,
    PromotionCodeId INT NOT NULL REFERENCES dbo.PromotionCodes(PromotionCodeId),
    UserId INT NOT NULL REFERENCES dbo.Users(UserId),
    OrderId INT NULL REFERENCES dbo.Orders(OrderId),
    RedeemedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    DiscountApplied DECIMAL(10,2) NULL,
    CONSTRAINT UQ_PromotionCodeRedemptions_UserCode UNIQUE (UserId, PromotionCodeId)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.PromotionCodeRedemptions') AND name = 'UX_PromotionCodeRedemptions_Order')
  CREATE UNIQUE INDEX UX_PromotionCodeRedemptions_Order ON dbo.PromotionCodeRedemptions(OrderId) WHERE OrderId IS NOT NULL;
GO

-- 12 progressive loyalty vouchers: the next reward unlocks with each order milestone.
INSERT INTO dbo.Vouchers
  (VoucherCode, VoucherName, RequiredOrderCount, DiscountType, DiscountValue, MinimumSpend, ValidFrom, ValidUntil)
SELECT s.VoucherCode, s.VoucherName, s.RequiredOrderCount, s.DiscountType, s.DiscountValue, s.MinimumSpend, '2026-01-01', '2026-12-31'
FROM (VALUES
  ('ORDER-01', N'First Hawker Treat', 1, 'fixed', 1.00, 5.00),
  ('ORDER-02', N'Returning Patron Treat', 2, 'fixed', 1.50, 6.00),
  ('ORDER-03', N'Third Order Saver', 3, 'percentage', 10.00, 8.00),
  ('ORDER-04', N'Four Orders Feast', 4, 'fixed', 2.00, 10.00),
  ('ORDER-05', N'Five-Time Favourite', 5, 'percentage', 12.00, 10.00),
  ('ORDER-06', N'Half-Dozen Reward', 6, 'fixed', 2.50, 12.00),
  ('ORDER-08', N'Eight Order Bonus', 8, 'percentage', 15.00, 12.00),
  ('ORDER-10', N'Ten Orders Thank You', 10, 'fixed', 3.00, 15.00),
  ('ORDER-12', N'Dozen Dining Reward', 12, 'percentage', 18.00, 15.00),
  ('ORDER-15', N'Fifteen Orders Perk', 15, 'fixed', 4.00, 18.00),
  ('ORDER-20', N'Twenty Orders Celebration', 20, 'percentage', 20.00, 20.00),
  ('ORDER-25', N'HawkerHub Loyalist', 25, 'fixed', 5.00, 25.00)
) s(VoucherCode, VoucherName, RequiredOrderCount, DiscountType, DiscountValue, MinimumSpend)
WHERE NOT EXISTS (SELECT 1 FROM dbo.Vouchers v WHERE v.VoucherCode = s.VoucherCode);
GO

-- 60 promotion codes. Each code is redeemable once per patron.
INSERT INTO dbo.PromotionCodes
  (Code, PromotionName, DiscountType, DiscountValue, MinimumSpend, ValidFrom, ValidUntil)
SELECT s.Code, s.PromotionName, s.DiscountType, s.DiscountValue, s.MinimumSpend, '2026-01-01', '2026-12-31'
FROM (VALUES
  ('WELCOME01', N'Welcome Savings 01', 'fixed', 1.00, 5.00), ('WELCOME02', N'Welcome Savings 02', 'fixed', 1.00, 5.00),
  ('WELCOME03', N'Welcome Savings 03', 'fixed', 1.00, 5.00), ('WELCOME04', N'Welcome Savings 04', 'fixed', 1.00, 5.00),
  ('WELCOME05', N'Welcome Savings 05', 'fixed', 1.00, 5.00), ('LUNCH01', N'Lunch Deal 01', 'percentage', 10.00, 8.00),
  ('LUNCH02', N'Lunch Deal 02', 'percentage', 10.00, 8.00), ('LUNCH03', N'Lunch Deal 03', 'percentage', 10.00, 8.00),
  ('LUNCH04', N'Lunch Deal 04', 'percentage', 10.00, 8.00), ('LUNCH05', N'Lunch Deal 05', 'percentage', 10.00, 8.00),
  ('DINNER01', N'Dinner Deal 01', 'fixed', 2.00, 12.00), ('DINNER02', N'Dinner Deal 02', 'fixed', 2.00, 12.00),
  ('DINNER03', N'Dinner Deal 03', 'fixed', 2.00, 12.00), ('DINNER04', N'Dinner Deal 04', 'fixed', 2.00, 12.00),
  ('DINNER05', N'Dinner Deal 05', 'fixed', 2.00, 12.00), ('ECO01', N'Eco Packaging Reward 01', 'percentage', 12.00, 10.00),
  ('ECO02', N'Eco Packaging Reward 02', 'percentage', 12.00, 10.00), ('ECO03', N'Eco Packaging Reward 03', 'percentage', 12.00, 10.00),
  ('ECO04', N'Eco Packaging Reward 04', 'percentage', 12.00, 10.00), ('ECO05', N'Eco Packaging Reward 05', 'percentage', 12.00, 10.00),
  ('HAWKER01', N'Hawker Favourites 01', 'fixed', 1.50, 8.00), ('HAWKER02', N'Hawker Favourites 02', 'fixed', 1.50, 8.00),
  ('HAWKER03', N'Hawker Favourites 03', 'fixed', 1.50, 8.00), ('HAWKER04', N'Hawker Favourites 04', 'fixed', 1.50, 8.00),
  ('HAWKER05', N'Hawker Favourites 05', 'fixed', 1.50, 8.00), ('SPICE01', N'Spice Route Deal 01', 'percentage', 15.00, 15.00),
  ('SPICE02', N'Spice Route Deal 02', 'percentage', 15.00, 15.00), ('SPICE03', N'Spice Route Deal 03', 'percentage', 15.00, 15.00),
  ('SPICE04', N'Spice Route Deal 04', 'percentage', 15.00, 15.00), ('SPICE05', N'Spice Route Deal 05', 'percentage', 15.00, 15.00),
  ('SAVER01', N'Everyday Saver 01', 'fixed', 2.50, 15.00), ('SAVER02', N'Everyday Saver 02', 'fixed', 2.50, 15.00),
  ('SAVER03', N'Everyday Saver 03', 'fixed', 2.50, 15.00), ('SAVER04', N'Everyday Saver 04', 'fixed', 2.50, 15.00),
  ('SAVER05', N'Everyday Saver 05', 'fixed', 2.50, 15.00), ('WEEKEND01', N'Weekend Treat 01', 'percentage', 18.00, 18.00),
  ('WEEKEND02', N'Weekend Treat 02', 'percentage', 18.00, 18.00), ('WEEKEND03', N'Weekend Treat 03', 'percentage', 18.00, 18.00),
  ('WEEKEND04', N'Weekend Treat 04', 'percentage', 18.00, 18.00), ('WEEKEND05', N'Weekend Treat 05', 'percentage', 18.00, 18.00),
  ('FOODIE01', N'Foodie Bonus 01', 'fixed', 3.00, 20.00), ('FOODIE02', N'Foodie Bonus 02', 'fixed', 3.00, 20.00),
  ('FOODIE03', N'Foodie Bonus 03', 'fixed', 3.00, 20.00), ('FOODIE04', N'Foodie Bonus 04', 'fixed', 3.00, 20.00),
  ('FOODIE05', N'Foodie Bonus 05', 'fixed', 3.00, 20.00), ('LOCAL01', N'Local Love 01', 'percentage', 20.00, 20.00),
  ('LOCAL02', N'Local Love 02', 'percentage', 20.00, 20.00), ('LOCAL03', N'Local Love 03', 'percentage', 20.00, 20.00),
  ('LOCAL04', N'Local Love 04', 'percentage', 20.00, 20.00), ('LOCAL05', N'Local Love 05', 'percentage', 20.00, 20.00),
  ('THANKYOU01', N'Thank You Reward 01', 'fixed', 4.00, 25.00), ('THANKYOU02', N'Thank You Reward 02', 'fixed', 4.00, 25.00),
  ('THANKYOU03', N'Thank You Reward 03', 'fixed', 4.00, 25.00), ('THANKYOU04', N'Thank You Reward 04', 'fixed', 4.00, 25.00),
  ('THANKYOU05', N'Thank You Reward 05', 'fixed', 4.00, 25.00), ('FESTIVE01', N'Festive Feast 01', 'percentage', 25.00, 25.00),
  ('FESTIVE02', N'Festive Feast 02', 'percentage', 25.00, 25.00), ('FESTIVE03', N'Festive Feast 03', 'percentage', 25.00, 25.00),
  ('FESTIVE04', N'Festive Feast 04', 'percentage', 25.00, 25.00), ('FESTIVE05', N'Festive Feast 05', 'percentage', 25.00, 25.00)
) s(Code, PromotionName, DiscountType, DiscountValue, MinimumSpend)
WHERE NOT EXISTS (SELECT 1 FROM dbo.PromotionCodes pc WHERE pc.Code = s.Code);
GO

-- Query this view to show each patron's unlocked, unredeemed loyalty vouchers.
CREATE OR ALTER VIEW dbo.vwPatronEligibleVouchers
AS
WITH PatronOrderCounts AS (
  SELECT u.UserId, COUNT(o.OrderId) AS CompletedOrders
  FROM dbo.Users u
  LEFT JOIN dbo.Orders o ON o.UserId = u.UserId AND o.Status <> 'Cancelled'
  WHERE u.Role = 'patron'
  GROUP BY u.UserId
)
SELECT
  poc.UserId,
  v.VoucherId,
  v.VoucherCode,
  v.VoucherName,
  v.RequiredOrderCount,
  v.DiscountType,
  v.DiscountValue,
  v.MinimumSpend,
  poc.CompletedOrders
FROM PatronOrderCounts poc
JOIN dbo.Vouchers v ON v.RequiredOrderCount <= poc.CompletedOrders
LEFT JOIN dbo.VoucherRedemptions vr ON vr.UserId = poc.UserId AND vr.VoucherId = v.VoucherId
WHERE vr.VoucherRedemptionId IS NULL
  AND v.IsActive = 1
  AND CAST(SYSDATETIME() AS DATE) BETWEEN v.ValidFrom AND v.ValidUntil;
GO
