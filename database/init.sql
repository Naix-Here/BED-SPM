SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.OrderStatusLog', 'U') IS NOT NULL DROP TABLE dbo.OrderStatusLog;
IF OBJECT_ID('dbo.CartItem', 'U') IS NOT NULL DROP TABLE dbo.CartItem;
IF OBJECT_ID('dbo.Cart', 'U') IS NOT NULL DROP TABLE dbo.Cart;
IF OBJECT_ID('dbo.VendorProfile', 'U') IS NOT NULL DROP TABLE dbo.VendorProfile;
IF OBJECT_ID('dbo.CustomerProfile', 'U') IS NOT NULL DROP TABLE dbo.CustomerProfile;
IF OBJECT_ID('dbo.Promotion', 'U') IS NOT NULL DROP TABLE dbo.Promotion;
IF OBJECT_ID('dbo.HygieneGrade', 'U') IS NOT NULL DROP TABLE dbo.HygieneGrade;
IF OBJECT_ID('dbo.Inspection', 'U') IS NOT NULL DROP TABLE dbo.Inspection;
IF OBJECT_ID('dbo.Notification', 'U') IS NOT NULL DROP TABLE dbo.Notification;
IF OBJECT_ID('dbo.QueueEntry', 'U') IS NOT NULL DROP TABLE dbo.QueueEntry;
IF OBJECT_ID('dbo.Complaint', 'U') IS NOT NULL DROP TABLE dbo.Complaint;
IF OBJECT_ID('dbo.Likes', 'U') IS NOT NULL DROP TABLE dbo.Likes;
IF OBJECT_ID('dbo.Feedback', 'U') IS NOT NULL DROP TABLE dbo.Feedback;
IF OBJECT_ID('dbo.OrderItem', 'U') IS NOT NULL DROP TABLE dbo.OrderItem;
IF OBJECT_ID('dbo.[Order]', 'U') IS NOT NULL DROP TABLE dbo.[Order];
IF OBJECT_ID('dbo.RentalAgreement', 'U') IS NOT NULL DROP TABLE dbo.RentalAgreement;
IF OBJECT_ID('dbo.MenuItemCuisine', 'U') IS NOT NULL DROP TABLE dbo.MenuItemCuisine;
IF OBJECT_ID('dbo.MenuItem', 'U') IS NOT NULL DROP TABLE dbo.MenuItem;
IF OBJECT_ID('dbo.Stall', 'U') IS NOT NULL DROP TABLE dbo.Stall;
IF OBJECT_ID('dbo.[User]', 'U') IS NOT NULL DROP TABLE dbo.[User];
IF OBJECT_ID('dbo.Cuisine', 'U') IS NOT NULL DROP TABLE dbo.Cuisine;
IF OBJECT_ID('dbo.HawkerCentre', 'U') IS NOT NULL DROP TABLE dbo.HawkerCentre;
GO

-- ============================================================
-- Table 1: HawkerCentre
-- ============================================================
CREATE TABLE HawkerCentre (
    HawkerCentreId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    OperatorName NVARCHAR(100) NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- Table 2: Cuisine
-- ============================================================
CREATE TABLE Cuisine (
    CuisineId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL UNIQUE
);
GO

-- ============================================================
-- Table 3: [User]  (User is reserved in SQL Server)
-- ============================================================
CREATE TABLE [User] (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Customer','Vendor','NEAOfficer','Operator')),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- ============================================================
-- Table 4: Stall
-- ============================================================
CREATE TABLE Stall (
    StallId INT IDENTITY(1,1) PRIMARY KEY,
    HawkerCentreId INT NOT NULL,
    OwnerId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    UnitNumber NVARCHAR(20) NOT NULL,
    ImageUrl NVARCHAR(500) NULL,
    Status NVARCHAR(20) DEFAULT 'Active' CHECK (Status IN ('Active','Closed','Suspended')),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (HawkerCentreId) REFERENCES HawkerCentre(HawkerCentreId),
    FOREIGN KEY (OwnerId) REFERENCES [User](UserId)
);
GO

-- ============================================================
-- Table 5: MenuItem
-- ============================================================
CREATE TABLE MenuItem (
    MenuItemId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    Price DECIMAL(10,2) NOT NULL CHECK (Price > 0),
    Category NVARCHAR(50) NOT NULL CHECK (Category IN ('Main','Drink','Dessert','Snack','Side')),
    IsAvailable BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId)
);
GO

-- ============================================================
-- Table 6: MenuItemCuisine
-- ============================================================
CREATE TABLE MenuItemCuisine (
    MenuItemCuisineId INT IDENTITY(1,1) PRIMARY KEY,
    MenuItemId INT NOT NULL,
    CuisineId INT NOT NULL,
    FOREIGN KEY (MenuItemId) REFERENCES MenuItem(MenuItemId),
    FOREIGN KEY (CuisineId) REFERENCES Cuisine(CuisineId),
    CONSTRAINT UQ_MenuItemCuisine UNIQUE (MenuItemId, CuisineId)
);
GO

-- ============================================================
-- Table 7: RentalAgreement
-- ============================================================
CREATE TABLE RentalAgreement (
    RentalAgreementId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    MonthlyRent DECIMAL(10,2) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NULL,
    Status NVARCHAR(20) DEFAULT 'Active' CHECK (Status IN ('Active','Expired','Terminated','Renewed')),
    Terms NVARCHAR(2000) NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId)
);
GO

-- ============================================================
-- Table 8: [Order]  (Order is reserved in SQL Server)
-- ============================================================
CREATE TABLE [Order] (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    CustomerId INT NULL,
    GuestName NVARCHAR(100) NULL,
    OrderDate DATETIME2 DEFAULT SYSDATETIME(),
    Status NVARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending','Preparing','Ready','Completed','Cancelled')),
    TotalAmount DECIMAL(10,2) NOT NULL,
    PaymentStatus NVARCHAR(20) DEFAULT 'Paid',
    SpecialInstructions NVARCHAR(500) NULL,
    FOREIGN KEY (StallId) REFERENCES Stall(StallId),
    FOREIGN KEY (CustomerId) REFERENCES [User](UserId)
);
GO

-- ============================================================
-- Table 9: OrderItem
-- ============================================================
CREATE TABLE OrderItem (
    OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    MenuItemId INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    UnitPrice DECIMAL(10,2) NOT NULL,
    AddOns NVARCHAR(500) NULL,
    AddOnCharge DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (OrderId) REFERENCES [Order](OrderId),
    FOREIGN KEY (MenuItemId) REFERENCES MenuItem(MenuItemId)
);
GO

-- ============================================================
-- Table 10: Feedback
-- ============================================================
CREATE TABLE Feedback (
    FeedbackId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    CustomerId INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId),
    FOREIGN KEY (CustomerId) REFERENCES [User](UserId)
);
GO

-- ============================================================
-- Table 11: Likes
-- ============================================================
CREATE TABLE Likes (
    LikeId INT IDENTITY(1,1) PRIMARY KEY,
    MenuItemId INT NOT NULL,
    CustomerId INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (MenuItemId) REFERENCES MenuItem(MenuItemId),
    FOREIGN KEY (CustomerId) REFERENCES [User](UserId),
    CONSTRAINT UQ_Likes UNIQUE (MenuItemId, CustomerId)
);
GO

-- ============================================================
-- Table 12: Complaint
-- ============================================================
CREATE TABLE Complaint (
    ComplaintId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    CustomerId INT NOT NULL,
    Subject NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Open' CHECK (Status IN ('Open','Investigating','Resolved')),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId),
    FOREIGN KEY (CustomerId) REFERENCES [User](UserId)
);
GO

-- ============================================================
-- Table 13: QueueEntry
-- ============================================================
CREATE TABLE QueueEntry (
    QueueEntryId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    CustomerId INT NOT NULL,
    QueueNumber INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Waiting' CHECK (Status IN ('Waiting','Served','Cancelled')),
    JoinedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId),
    FOREIGN KEY (CustomerId) REFERENCES [User](UserId)
);
GO

-- ============================================================
-- Table 14: Notification
-- ============================================================
CREATE TABLE Notification (
    NotificationId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(1000) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (UserId) REFERENCES [User](UserId)
);
GO

-- ============================================================
-- Table 15: Inspection
-- ============================================================
CREATE TABLE Inspection (
    InspectionId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    OfficerId INT NOT NULL,
    InspectionDate DATE NOT NULL,
    Score DECIMAL(5,2) NOT NULL CHECK (Score >= 0 AND Score <= 100),
    Remarks NVARCHAR(2000) NULL,
    GradeIssued NCHAR(1) NOT NULL CHECK (GradeIssued IN ('A','B','C','D')),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId),
    FOREIGN KEY (OfficerId) REFERENCES [User](UserId)
);
GO

-- ============================================================
-- Table 16: HygieneGrade
-- ============================================================
CREATE TABLE HygieneGrade (
    HygieneGradeId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    Grade NCHAR(1) NOT NULL CHECK (Grade IN ('A','B','C','D')),
    IssuedDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    InspectionId INT NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId),
    FOREIGN KEY (InspectionId) REFERENCES Inspection(InspectionId)
);
GO

-- ============================================================
-- Table 17: Promotion
-- ============================================================
CREATE TABLE Promotion (
    PromotionId INT IDENTITY(1,1) PRIMARY KEY,
    StallId INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000) NULL,
    DiscountType NVARCHAR(20) NOT NULL CHECK (DiscountType IN ('Percentage','Fixed','Points','Delivery')),
    DiscountValue DECIMAL(10,2) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId)
);
GO

-- ============================================================
-- Table 18: CustomerProfile
-- ============================================================
CREATE TABLE CustomerProfile (
    CustomerProfileId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    LoyaltyPoints INT DEFAULT 0,
    Phone NVARCHAR(20) NULL,
    PreferredLanguage NVARCHAR(10) DEFAULT 'en',
    FOREIGN KEY (UserId) REFERENCES [User](UserId)
);
GO

-- ============================================================
-- Table 19: VendorProfile
-- ============================================================
CREATE TABLE VendorProfile (
    VendorProfileId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL UNIQUE,
    BusinessName NVARCHAR(100) NULL,
    ContactNumber NVARCHAR(20) NULL,
    StallId INT NULL,
    FOREIGN KEY (UserId) REFERENCES [User](UserId),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId)
);
GO

-- ============================================================
-- Table 20: Cart
-- ============================================================
CREATE TABLE Cart (
    CartId INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NULL,
    SessionId NVARCHAR(100) NULL,
    StallId INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    FOREIGN KEY (CustomerId) REFERENCES [User](UserId),
    FOREIGN KEY (StallId) REFERENCES Stall(StallId)
);
GO

-- ============================================================
-- Table 21: CartItem
-- ============================================================
CREATE TABLE CartItem (
    CartItemId INT IDENTITY(1,1) PRIMARY KEY,
    CartId INT NOT NULL,
    MenuItemId INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    AddOns NVARCHAR(500) NULL,
    AddOnCharge DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (CartId) REFERENCES Cart(CartId),
    FOREIGN KEY (MenuItemId) REFERENCES MenuItem(MenuItemId)
);
GO

-- ============================================================
-- Table 22: OrderStatusLog
-- ============================================================
CREATE TABLE OrderStatusLog (
    LogId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    ChangedAt DATETIME2 DEFAULT SYSDATETIME(),
    ChangedBy INT NULL,
    FOREIGN KEY (OrderId) REFERENCES [Order](OrderId),
    FOREIGN KEY (ChangedBy) REFERENCES [User](UserId)
);
GO

PRINT '✅ All 22 SHCMS tables created successfully.';
GO
