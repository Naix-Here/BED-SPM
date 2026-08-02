// controllers/rentalAgreementController.js — HTTP handlers for /api/rental-agreements.
const rentalAgreementModel = require('../models/rentalAgreementModel');
const stallModel = require('../models/stallModel');
const { RENTAL_STATUS } = require('../config/constants');

/**
 * GET /api/rental-agreements
 * Operator: all; Vendor: only stalls they own; ?stallId= optional filter.
 */
async function getAllAgreements(req, res) {
  try {
    const stallId = req.query.stallId ? parseInt(req.query.stallId, 10) : null;
    let agreements;
    if (req.user.role === 'Vendor') {
      if (stallId) {
        const stall = await stallModel.getStallById(stallId);
        if (!stall) {
          return res.status(404).json({ success: false, message: 'Stall not found.' });
        }
        if (stall.OwnerId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'You can only view agreements for your own stalls.' });
        }
        agreements = await rentalAgreementModel.getAllAgreements(stallId);
      } else {
        agreements = await rentalAgreementModel.getAgreementsByOwnerId(req.user.id);
      }
    } else if (req.user.role === 'Operator') {
      agreements = await rentalAgreementModel.getAllAgreements(stallId);
    } else {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return res.status(200).json({
      success: true,
      message: 'Rental agreements retrieved successfully.',
      data: agreements,
      count: agreements.length,
    });
  } catch (error) {
    console.error('getAllAgreements error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve rental agreements.', error: error.message });
  }
}

/**
 * GET /api/rental-agreements/:id
 * Vendor can only view their own.
 */
async function getAgreementById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const agreement = await rentalAgreementModel.getAgreementById(id);
    if (!agreement) {
      return res.status(404).json({ success: false, message: 'Rental agreement not found.' });
    }
    if (req.user.role === 'Vendor' && agreement.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view your own rental agreements.' });
    }
    if (req.user.role !== 'Vendor' && req.user.role !== 'Operator') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return res.status(200).json({
      success: true,
      message: 'Rental agreement retrieved successfully.',
      data: agreement,
    });
  } catch (error) {
    console.error('getAgreementById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve rental agreement.', error: error.message });
  }
}

/**
 * POST /api/rental-agreements  (Operator only)
 */
async function createAgreement(req, res) {
  try {
    const { stallId, monthlyRent, startDate, endDate, status, terms } = req.body;
    if (!stallId || monthlyRent === undefined || !startDate) {
      return res.status(400).json({ success: false, message: 'stallId, monthlyRent, and startDate are required.' });
    }
    const rent = Number(monthlyRent);
    if (!Number.isFinite(rent) || rent <= 0) {
      return res.status(400).json({ success: false, message: 'monthlyRent must be a positive number.' });
    }
    if (status && !RENTAL_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${RENTAL_STATUS.join(', ')}.` });
    }
    if (terms && terms.length > 2000) {
      return res.status(400).json({ success: false, message: 'terms must be <= 2000 characters.' });
    }
    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'endDate must be after startDate.' });
    }

    const stall = await stallModel.getStallById(stallId);
    if (!stall) {
      return res.status(400).json({ success: false, message: 'Stall does not exist.' });
    }

    const agreement = await rentalAgreementModel.createAgreement({
      stallId, monthlyRent: rent, startDate, endDate: endDate || null,
      status: status || 'Active', terms: terms || null,
    });
    return res.status(201).json({
      success: true,
      message: 'Rental agreement created successfully.',
      data: agreement,
    });
  } catch (error) {
    console.error('createAgreement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create rental agreement.', error: error.message });
  }
}

/**
 * PUT /api/rental-agreements/:id  (Operator only)
 */
async function updateAgreement(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const existing = await rentalAgreementModel.getAgreementById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Rental agreement not found.' });
    }

    const { stallId, monthlyRent, startDate, endDate, status, terms } = req.body;
    if (!stallId || monthlyRent === undefined || !startDate) {
      return res.status(400).json({ success: false, message: 'stallId, monthlyRent, and startDate are required.' });
    }
    const rent = Number(monthlyRent);
    if (!Number.isFinite(rent) || rent <= 0) {
      return res.status(400).json({ success: false, message: 'monthlyRent must be a positive number.' });
    }
    if (status && !RENTAL_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${RENTAL_STATUS.join(', ')}.` });
    }
    if (terms && terms.length > 2000) {
      return res.status(400).json({ success: false, message: 'terms must be <= 2000 characters.' });
    }
    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'endDate must be after startDate.' });
    }

    const stall = await stallModel.getStallById(stallId);
    if (!stall) {
      return res.status(400).json({ success: false, message: 'Stall does not exist.' });
    }

    const updated = await rentalAgreementModel.updateAgreement(id, {
      stallId, monthlyRent: rent, startDate, endDate: endDate || null,
      status: status || 'Active', terms: terms || null,
    });
    return res.status(200).json({
      success: true,
      message: 'Rental agreement updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('updateAgreement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update rental agreement.', error: error.message });
  }
}

/**
 * DELETE /api/rental-agreements/:id  (Operator only)
 */
async function deleteAgreement(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const existing = await rentalAgreementModel.getAgreementById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Rental agreement not found.' });
    }
    const ok = await rentalAgreementModel.deleteAgreement(id);
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Failed to delete rental agreement.' });
    }
    return res.status(200).json({ success: true, message: 'Rental agreement deleted successfully.' });
  } catch (error) {
    console.error('deleteAgreement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete rental agreement.', error: error.message });
  }
}

module.exports = {
  getAllAgreements,
  getAgreementById,
  createAgreement,
  updateAgreement,
  deleteAgreement,
};
