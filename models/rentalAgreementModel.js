// models/rentalAgreementModel.js — CRUD for the RentalAgreement table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllAgreements(stallId) {
  await poolConnect;
  const request = pool.request();
  let query = `
    SELECT ra.RentalAgreementId, ra.StallId, ra.MonthlyRent, ra.StartDate, ra.EndDate,
           ra.Status, ra.Terms, ra.CreatedAt,
           s.Name AS StallName, s.OwnerId, s.HawkerCentreId,
           hc.Name AS HawkerCentreName
    FROM RentalAgreement ra
    JOIN Stall s ON ra.StallId = s.StallId
    JOIN HawkerCentre hc ON s.HawkerCentreId = hc.HawkerCentreId
  `;
  if (stallId) {
    request.input('StallId', sql.Int, stallId);
    query += ' WHERE ra.StallId = @StallId';
  }
  query += ' ORDER BY ra.StartDate DESC, ra.RentalAgreementId DESC';
  const result = await request.query(query);
  return result.recordset;
}

async function getAgreementById(rentalAgreementId) {
  await poolConnect;
  const request = pool.request();
  request.input('RentalAgreementId', sql.Int, rentalAgreementId);
  const result = await request.query(`
    SELECT ra.RentalAgreementId, ra.StallId, ra.MonthlyRent, ra.StartDate, ra.EndDate,
           ra.Status, ra.Terms, ra.CreatedAt,
           s.Name AS StallName, s.OwnerId, s.HawkerCentreId,
           hc.Name AS HawkerCentreName
    FROM RentalAgreement ra
    JOIN Stall s ON ra.StallId = s.StallId
    JOIN HawkerCentre hc ON s.HawkerCentreId = hc.HawkerCentreId
    WHERE ra.RentalAgreementId = @RentalAgreementId
  `);
  return result.recordset[0] || null;
}

async function getAgreementsByOwnerId(ownerId) {
  await poolConnect;
  const request = pool.request();
  request.input('OwnerId', sql.Int, ownerId);
  const result = await request.query(`
    SELECT ra.RentalAgreementId, ra.StallId, ra.MonthlyRent, ra.StartDate, ra.EndDate,
           ra.Status, ra.Terms, ra.CreatedAt,
           s.Name AS StallName, s.OwnerId, s.HawkerCentreId,
           hc.Name AS HawkerCentreName
    FROM RentalAgreement ra
    JOIN Stall s ON ra.StallId = s.StallId
    JOIN HawkerCentre hc ON s.HawkerCentreId = hc.HawkerCentreId
    WHERE s.OwnerId = @OwnerId
    ORDER BY ra.StartDate DESC, ra.RentalAgreementId DESC
  `);
  return result.recordset;
}

async function createAgreement(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('MonthlyRent', sql.Decimal(10, 2), data.monthlyRent);
  request.input('StartDate', sql.Date, data.startDate);
  request.input('EndDate', sql.Date, data.endDate || null);
  request.input('Status', sql.NVarChar(20), data.status || 'Active');
  request.input('Terms', sql.NVarChar(2000), data.terms || null);
  const result = await request.query(`
    INSERT INTO RentalAgreement (StallId, MonthlyRent, StartDate, EndDate, Status, Terms)
    OUTPUT INSERTED.*
    VALUES (@StallId, @MonthlyRent, @StartDate, @EndDate, @Status, @Terms)
  `);
  return result.recordset[0];
}

async function updateAgreement(rentalAgreementId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('RentalAgreementId', sql.Int, rentalAgreementId);
  request.input('StallId', sql.Int, data.stallId);
  request.input('MonthlyRent', sql.Decimal(10, 2), data.monthlyRent);
  request.input('StartDate', sql.Date, data.startDate);
  request.input('EndDate', sql.Date, data.endDate || null);
  request.input('Status', sql.NVarChar(20), data.status || 'Active');
  request.input('Terms', sql.NVarChar(2000), data.terms || null);
  const result = await request.query(`
    UPDATE RentalAgreement
    SET StallId = @StallId, MonthlyRent = @MonthlyRent, StartDate = @StartDate,
        EndDate = @EndDate, Status = @Status, Terms = @Terms
    OUTPUT INSERTED.*
    WHERE RentalAgreementId = @RentalAgreementId
  `);
  return result.recordset[0] || null;
}

async function deleteAgreement(rentalAgreementId) {
  await poolConnect;
  const request = pool.request();
  request.input('RentalAgreementId', sql.Int, rentalAgreementId);
  const result = await request.query(
    'DELETE FROM RentalAgreement WHERE RentalAgreementId = @RentalAgreementId'
  );
  return result.rowsAffected[0] > 0;
}

module.exports = {
  getAllAgreements,
  getAgreementById,
  getAgreementsByOwnerId,
  createAgreement,
  updateAgreement,
  deleteAgreement,
};
