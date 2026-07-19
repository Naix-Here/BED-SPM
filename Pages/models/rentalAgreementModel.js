// models/rentalAgreementModel.js — Full CRUD for rental agreements + expiry alerts
const { sql, getPool } = require('../config/database');

const RentalAgreement = {
  async findByVendorId(vendorId) {
    return (await (await getPool()).request().input('vendorId', sql.Int, vendorId).query(`SELECT ra.*,s.StallName,s.StallNumber,hc.Name AS CentreName FROM dbo.RentalAgreements ra JOIN dbo.Stalls s ON s.StallId=ra.StallId JOIN dbo.HawkerCentres hc ON hc.CentreId=s.CentreId WHERE s.OwnerId=@vendorId ORDER BY ra.StartDate DESC`)).recordset;
  },

  async findById(agreementId) {
    return (await (await getPool()).request().input('agreementId', sql.Int, agreementId).query(`SELECT ra.*,s.StallName,s.StallNumber,s.OwnerId,hc.Name AS CentreName FROM dbo.RentalAgreements ra JOIN dbo.Stalls s ON s.StallId=ra.StallId JOIN dbo.HawkerCentres hc ON hc.CentreId=s.CentreId WHERE ra.AgreementId=@agreementId`)).recordset[0] || null;
  },

  async create(data) {
    const { stallId, startDate, endDate, monthlyRent, deposit, terms, signedDate } = data;
    const overlap = (await (await getPool()).request().input('stallId', sql.Int, stallId).input('start', sql.Date, startDate).input('end', sql.Date, endDate).query(`SELECT * FROM dbo.RentalAgreements WHERE StallId=@stallId AND Status='active' AND ((StartDate<=@end AND EndDate>=@start) OR (StartDate<=@start AND EndDate>=@end))`)).recordset;
    if (overlap.length) throw new (require('../utils/AppError'))('An active rental agreement already exists for this period.', 409);
    const result = await (await getPool()).request().input('stallId', sql.Int, stallId).input('startDate', sql.Date, startDate).input('endDate', sql.Date, endDate).input('monthlyRent', sql.Decimal(10,2), monthlyRent).input('deposit', sql.Decimal(10,2), deposit || null).input('terms', sql.NVarChar(sql.MAX), terms || null).input('signedDate', sql.Date, signedDate || null).query(`INSERT INTO dbo.RentalAgreements (StallId,StartDate,EndDate,MonthlyRent,Deposit,Terms,SignedDate) OUTPUT INSERTED.AgreementId VALUES (@stallId,@startDate,@endDate,@monthlyRent,@deposit,@terms,@signedDate)`);
    return { agreementId: result.recordset[0].AgreementId, ...data };
  },

  async update(agreementId, data) {
    const fields = [], req = (await getPool()).request();
    ['StartDate','EndDate','MonthlyRent','Deposit','Terms','Status','SignedDate'].forEach(f => {
      if (data[f] !== undefined) { fields.push(`${f}=@${f}`); req.input(f, f==='MonthlyRent'||f==='Deposit'?sql.Decimal(10,2):f==='Terms'?sql.NVarChar(sql.MAX):f==='StartDate'||f==='EndDate'||f==='SignedDate'?sql.Date:sql.VarChar(20), data[f]); }
    });
    if (!fields.length) throw new (require('../utils/AppError'))('No fields to update.', 400);
    req.input('agreementId', sql.Int, agreementId);
    await req.query(`UPDATE dbo.RentalAgreements SET ${fields.join(',')},UpdatedAt=SYSDATETIME() WHERE AgreementId=@agreementId`);
    return this.findById(agreementId);
  },

  async delete(agreementId) {
    const agreement = await this.findById(agreementId);
    if (!agreement) throw new (require('../utils/AppError'))('Rental agreement not found.', 404);
    if (agreement.Status === 'active') throw new (require('../utils/AppError'))('Cannot delete an active agreement. Terminate it first.', 400);
    await (await getPool()).request().input('agreementId', sql.Int, agreementId).query(`DELETE FROM dbo.RentalAgreements WHERE AgreementId=@agreementId`);
    return { agreementId, deleted: true };
  },

  async getUpcomingExpiries(vendorId, days = 30) {
    return (await (await getPool()).request().input('vendorId', sql.Int, vendorId).input('days', sql.Int, days).query(`SELECT ra.*,s.StallName,s.StallNumber,DATEDIFF(DAY,GETDATE(),ra.EndDate) AS DaysRemaining FROM dbo.RentalAgreements ra JOIN dbo.Stalls s ON s.StallId=ra.StallId WHERE s.OwnerId=@vendorId AND ra.Status='active' AND ra.EndDate BETWEEN GETDATE() AND DATEADD(DAY,@days,GETDATE()) ORDER BY ra.EndDate ASC`)).recordset;
  }
};

module.exports = RentalAgreement;
