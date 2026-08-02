// controllers/hygieneGradeController.js
const hygieneGradeModel = require('../models/hygieneGradeModel');

async function getAllGrades(req, res, next) {
  try {
    const stallId = req.query.stallId ? parseInt(req.query.stallId) : null;
    const rows = await hygieneGradeModel.getAllHygieneGrades(stallId);
    res.status(200).json({ success: true, message: 'Hygiene grades retrieved', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getGradeById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await hygieneGradeModel.getHygieneGradeById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Hygiene grade not found' });
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function getStallHistory(req, res, next) {
  try {
    const stallId = parseInt(req.params.stallId);
    const rows = await hygieneGradeModel.getHistoryForStall(stallId);
    res.status(200).json({ success: true, message: 'Stall grade history', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function createGrade(req, res, next) {
  try {
    const { stallId, grade, issuedDate, expiryDate, inspectionId } = req.body;
    const exists = await hygieneGradeModel.stallExists(stallId);
    if (!exists) return res.status(400).json({ success: false, message: 'Stall not found' });

    if (inspectionId) {
      const inspExists = await hygieneGradeModel.inspectionExists(inspectionId);
      if (!inspExists) return res.status(400).json({ success: false, message: 'Referenced inspection not found' });
    }

    if (new Date(expiryDate) <= new Date(issuedDate)) {
      return res.status(400).json({ success: false, message: 'Expiry date must be after issued date' });
    }

    const created = await hygieneGradeModel.createHygieneGrade({
      stallId, grade, issuedDate, expiryDate, inspectionId,
    });
    res.status(201).json({ success: true, message: 'Hygiene grade issued', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateGrade(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { grade, issuedDate, expiryDate, inspectionId } = req.body;
    const existing = await hygieneGradeModel.getHygieneGradeById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Hygiene grade not found' });

    if (new Date(expiryDate) <= new Date(issuedDate)) {
      return res.status(400).json({ success: false, message: 'Expiry date must be after issued date' });
    }

    const updated = await hygieneGradeModel.updateHygieneGrade(id, {
      grade, issuedDate, expiryDate, inspectionId,
    });
    res.status(200).json({ success: true, message: 'Hygiene grade updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteGrade(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await hygieneGradeModel.getHygieneGradeById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Hygiene grade not found' });
    const ok = await hygieneGradeModel.deleteHygieneGrade(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Hygiene grade not found' });
    res.status(200).json({ success: true, message: 'Hygiene grade deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllGrades,
  getGradeById,
  getStallHistory,
  createGrade,
  updateGrade,
  deleteGrade,
};
