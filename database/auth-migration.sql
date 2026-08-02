-- Apply this once to existing databases (do not use init.sql, which recreates all tables).
IF COL_LENGTH('dbo.User', 'GoogleSubject') IS NULL
  EXEC('ALTER TABLE dbo.[User] ADD GoogleSubject NVARCHAR(255) NULL');
IF COL_LENGTH('dbo.User', 'PasswordResetTokenHash') IS NULL
  EXEC('ALTER TABLE dbo.[User] ADD PasswordResetTokenHash NVARCHAR(64) NULL');
IF COL_LENGTH('dbo.User', 'PasswordResetExpiresAt') IS NULL
  EXEC('ALTER TABLE dbo.[User] ADD PasswordResetExpiresAt DATETIME2 NULL');
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_User_GoogleSubject' AND object_id = OBJECT_ID('dbo.User'))
  EXEC('CREATE UNIQUE INDEX UQ_User_GoogleSubject ON dbo.[User](GoogleSubject) WHERE GoogleSubject IS NOT NULL');
