// models/userModel.js — CRUD for the [User] table.
const { sql, pool } = require('../config/dbConfig');

const UserModel = {
  async create(user) {
    const result = await pool
      .request()
      .input('Email', sql.NVarChar(255), user.email)
      .input('PasswordHash', sql.NVarChar(255), user.passwordHash)
      .input('FullName', sql.NVarChar(100), user.fullName)
      .input('Role', sql.NVarChar(20), user.role).query(`
        INSERT INTO [User] (Email, PasswordHash, FullName, Role)
        OUTPUT INSERTED.UserId, INSERTED.Email, INSERTED.FullName, INSERTED.Role
        VALUES (@Email, @PasswordHash, @FullName, @Role)
      `);
    return result.recordset[0];
  },

  async findByEmail(email) {
    const result = await pool
      .request()
      .input('Email', sql.NVarChar(255), email)
      .query('SELECT * FROM [User] WHERE Email = @Email');
    return result.recordset[0] || null;
  },

  async findById(id) {
    const result = await pool
      .request()
      .input('UserId', sql.Int, id)
      .query(
        'SELECT UserId, Email, FullName, Role, CreatedAt FROM [User] WHERE UserId = @UserId'
      );
    return result.recordset[0] || null;
  },

  async findByIdWithPassword(id) {
    const result = await pool
      .request()
      .input('UserId', sql.Int, id)
      .query('SELECT * FROM [User] WHERE UserId = @UserId');
    return result.recordset[0] || null;
  },

  async updatePassword(id, newHash) {
    await pool
      .request()
      .input('UserId', sql.Int, id)
      .input('PasswordHash', sql.NVarChar(255), newHash)
      .query('UPDATE [User] SET PasswordHash = @PasswordHash WHERE UserId = @UserId');
  },

  async getAll() {
    const result = await pool
      .request()
      .query(
        'SELECT UserId, Email, FullName, Role, CreatedAt FROM [User] ORDER BY UserId'
      );
    return result.recordset;
  },
};

module.exports = UserModel;
