// models/customerProfileModel.js — CRUD for the CustomerProfile table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getProfileByUserId(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  const result = await request.query(`
    SELECT cp.CustomerProfileId, cp.UserId, cp.LoyaltyPoints, cp.Phone,
           cp.PreferredLanguage,
           u.Email, u.FullName, u.Role, u.CreatedAt
    FROM CustomerProfile cp
    JOIN [User] u ON cp.UserId = u.UserId
    WHERE cp.UserId = @UserId
  `);
  return result.recordset[0] || null;
}

async function getProfileById(customerProfileId) {
  await poolConnect;
  const request = pool.request();
  request.input('CustomerProfileId', sql.Int, customerProfileId);
  const result = await request.query(`
    SELECT cp.CustomerProfileId, cp.UserId, cp.LoyaltyPoints, cp.Phone,
           cp.PreferredLanguage,
           u.Email, u.FullName, u.Role, u.CreatedAt
    FROM CustomerProfile cp
    JOIN [User] u ON cp.UserId = u.UserId
    WHERE cp.CustomerProfileId = @CustomerProfileId
  `);
  return result.recordset[0] || null;
}

async function createCustomerProfile(data) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, data.userId);
  request.input('LoyaltyPoints', sql.Int, data.loyaltyPoints || 0);
  request.input('Phone', sql.NVarChar(20), data.phone || null);
  request.input('PreferredLanguage', sql.NVarChar(10), data.preferredLanguage || 'en');
  const result = await request.query(`
    INSERT INTO CustomerProfile (UserId, LoyaltyPoints, Phone, PreferredLanguage)
    OUTPUT INSERTED.*
    VALUES (@UserId, @LoyaltyPoints, @Phone, @PreferredLanguage)
  `);
  return result.recordset[0];
}

async function updateCustomerProfile(userId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  request.input('LoyaltyPoints', sql.Int, data.loyaltyPoints || 0);
  request.input('Phone', sql.NVarChar(20), data.phone || null);
  request.input('PreferredLanguage', sql.NVarChar(10), data.preferredLanguage || 'en');
  const result = await request.query(`
    UPDATE CustomerProfile
    SET LoyaltyPoints = @LoyaltyPoints,
        Phone = @Phone,
        PreferredLanguage = @PreferredLanguage
    OUTPUT INSERTED.*
    WHERE UserId = @UserId
  `);
  return result.recordset[0] || null;
}

async function deleteCustomerProfile(customerProfileId) {
  await poolConnect;
  const request = pool.request();
  request.input('CustomerProfileId', sql.Int, customerProfileId);
  const result = await request.query('DELETE FROM CustomerProfile WHERE CustomerProfileId = @CustomerProfileId');
  return result.rowsAffected[0] > 0;
}

module.exports = {
  getProfileByUserId,
  getProfileById,
  createCustomerProfile,
  updateCustomerProfile,
  deleteCustomerProfile,
};
