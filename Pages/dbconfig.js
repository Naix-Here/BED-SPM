module.exports = {
  user: "booksapi_user", // Replace with your SQL Server login username
  password: "password", // Replace with your SQL Server login password
  server: "localhost",
  database: "HawkerCentreMS",
  port: 1433,
  connectionTimeout: 60000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};
