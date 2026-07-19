/* Run this in SSMS if HawkerCentreMS has already been created. */
USE HawkerCentreMS;
GO
IF OBJECT_ID('dbo.Carts', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Carts (
    CartId INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL UNIQUE REFERENCES dbo.Users(UserId),
    CartItemsJson NVARCHAR(MAX) NOT NULL DEFAULT N'[]',
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT CK_Carts_ItemsJson CHECK (ISJSON(CartItemsJson) = 1)
  );
END;
GO