/* Run after database_setup.sql, features_schema.sql, and vouchers_and_promotion_codes.sql. */
USE HawkerCentreMS;
GO
IF COL_LENGTH('dbo.OrderItems', 'MenuItemId') IS NULL
BEGIN
  ALTER TABLE dbo.OrderItems ALTER COLUMN ProductId INT NULL;
  ALTER TABLE dbo.OrderItems ADD MenuItemId INT NULL REFERENCES dbo.MenuItems(ItemId);
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('dbo.OrderItems') AND name='CK_OrderItems_OneMenuSource')
  ALTER TABLE dbo.OrderItems ADD CONSTRAINT CK_OrderItems_OneMenuSource CHECK ((ProductId IS NOT NULL AND MenuItemId IS NULL) OR (ProductId IS NULL AND MenuItemId IS NOT NULL));
GO
