// controllers/inspectionController.js
const inspectionModel = require('../models/inspectionModel');

async function getAllInspections(req, res, next) {
  try {
    const stallId = req.query.stallId ? parseInt(req.query.stallId) : null;
    const officerId = req.query.officerId ? parseInt(req.query.officerId) : null;
    const rows = await inspectionModel.getAllInspections(stallId, officerId);
    res.status(200).json({ success: true, message: 'Inspections retrieved', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getInspectionById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await inspectionModel.getInspectionById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Inspection not found' });
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function createInspection(req, res, next) {
  try {
    const { stallId, inspectionDate, score, remarks, gradeIssued } = req.body;
    const officerId = req.user.id;

    const exists = await inspectionModel.stallExists(stallId);
    if (!exists) {
      return res.status(400).json({ success: false, message: 'Stall not found' });
    }
    const created = await inspectionModel.createInspection({
      stallId, officerId, inspectionDate, score, remarks, gradeIssued,
    });
    res.status(201).json({ success: true, message: 'Inspection created', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateInspection(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { inspectionDate, score, remarks, gradeIssued } = req.body;
    const existing = await inspectionModel.getInspectionById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Inspection not found' });
    if (existing.OfficerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own inspections' });
    }
    const updated = await inspectionModel.updateInspection(id, {
      inspectionDate, score, remarks, gradeIssued,
    });
    res.status(200).json({ success: true, message: 'Inspection updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteInspection(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await inspectionModel.getInspectionById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Inspection not found' });
    const ok = await inspectionModel.deleteInspection(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Inspection not found' });
    res.status(200).json({ success: true, message: 'Inspection deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
};
