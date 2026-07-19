CREATE DATABASE HawkerCentreMS; 
USE HawkerCentreMS;
GO

CREATE TABLE FoodItems (
    FoodId INT IDENTITY(1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Price DECIMAL(5,2) NOT NULL,
    StallName VARCHAR(100) NOT NULL
);

-- Insert some test hawker food!
INSERT INTO FoodItems (Name, Price, StallName) VALUES 
('Chicken Rice', 4.50, 'Tian Tian Hainanese Chicken Rice'),
('Laksa', 5.00, 'Roxy Laksa'),
('Char Kway Teow', 4.80, 'Hill Street Fried Kway Teow');
SELECT * FROM dbo.Carts;