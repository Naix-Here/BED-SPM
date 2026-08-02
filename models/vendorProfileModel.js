// models/vendorProfileModel.js — CRUD for the VendorProfile table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getProfileByUserId(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  const result = await request.query(`
    SELECT vp.VendorProfileId, vp.UserId, vp.BusinessName, vp.ContactNumber, vp.StallId,
           u.Email, u.FullName, u.Role, u.CreatedAt,
           s.Name AS StallName, s.HawkerCentreId,
           hc.Name AS HawkerCentreName
    FROM VendorProfile vp
    JOIN [User] u ON vp.UserId = u.UserId
    LEFT JOIN Stall s ON vp.StallId = s.StallId
    LEFT JOIN HawkerCentre hc ON s.HawkerCentreId = hc.HawkerCentreId
    WHERE vp.UserId = @UserId
  `);
  return result.recordset[0] || null;
}

async function getProfileById(vendorProfileId) {
  await poolConnect;
  const request = pool.request();
  request.input('VendorProfileId', sql.Int, vendorProfileId);
  const result = await request.query(`
    SELECT vp.VendorProfileId, vp.UserId, vp.BusinessName, vp.ContactNumber, vp.StallId,
           u.Email, u.FullName, u.Role, u.CreatedAt,
           s.Name AS StallName, s.HawkerCentreId,
           hc.Name AS HawkerCentreName
    FROM VendorProfile vp
    JOIN [User] u ON vp.UserId = u.UserId
    LEFT JOIN Stall s ON vp.StallId = s.StallId
    LEFT JOIN HawkerCentre hc ON s.HawkerCentreId = hc.HawkerCentreId
    WHERE vp.VendorProfileId = @VendorProfileId
  `);
  return result.recordset[0] || null;
}

async function createVendorProfile(data) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, data.userId);
  request.input('BusinessName', sql.NVarChar(100), data.businessName || null);
  request.input('ContactNumber', sql.NVarChar(20), data.contactNumber || null);
  request.input('StallId', sql.Int, data.stallId || null);
  const result = await request.query(`
    INSERT INTO VendorProfile (UserId, BusinessName, ContactNumber, StallId)
    OUTPUT INSERTED.*
    VALUES (@UserId, @BusinessName, @ContactNumber, @StallId)
  `);
  return result.recordset[0];
}

async function updateVendorProfile(userId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  request.input('BusinessName', sql.NVarChar(100), data.businessName || null);
  request.input('ContactNumber', sql.NVarChar(20), data.contactNumber || null);
  request.input('StallId', sql.Int, data.stallId || null);
  const result = await request.query(`
    UPDATE VendorProfile
    SET BusinessName = @BusinessName,
        ContactNumber = @ContactNumber,
        StallId = @StallId
    OUTPUT INSERTED.*
    WHERE UserId = @UserId
  `);
  return result.recordset[0] || null;
}

async function deleteVendorProfile(vendorProfileId) {
  await poolConnect;
  const request = pool.request();
  request.input('VendorProfileId', sql.Int, vendorProfileId);
  const result = await request.query('DELETE FROM VendorProfile WHERE VendorProfileId = @VendorProfileId');
  return result.rowsAffected[0] > 0;
}

module.exports = {
  getProfileByUserId,
  getProfileById,
  createVendorProfile,
  updateVendorProfile,
  deleteVendorProfile,
};
