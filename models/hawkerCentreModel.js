// models/hawkerCentreModel.js — Basic CRUD for HawkerCentre.
const { sql, pool } = require('../config/dbConfig');

const HawkerCentreModel = {
  async getAll() {
    const result = await pool
      .request()
      .query('SELECT * FROM HawkerCentre ORDER BY HawkerCentreId');
    return result.recordset;
  },

  async getById(id) {
    const result = await pool
      .request()
      .input('HawkerCentreId', sql.Int, id)
      .query('SELECT * FROM HawkerCentre WHERE HawkerCentreId = @HawkerCentreId');
    return result.recordset[0] || null;
  },
};

module.exports = HawkerCentreModel;
