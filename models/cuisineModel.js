// models/cuisineModel.js — Basic CRUD for Cuisine.
const { sql, pool } = require('../config/dbConfig');

const CuisineModel = {
  async getAll() {
    const result = await pool
      .request()
      .query('SELECT * FROM Cuisine ORDER BY CuisineId');
    return result.recordset;
  },

  async getById(id) {
    const result = await pool
      .request()
      .input('CuisineId', sql.Int, id)
      .query('SELECT * FROM Cuisine WHERE CuisineId = @CuisineId');
    return result.recordset[0] || null;
  },
};

module.exports = CuisineModel;
