const complaintModel = require('../models/complaintModel');

async function getAllComplaints(req, res, next) {
  try {
    if (req.user.role === 'Customer') {
      const rows = await complaintModel.getAllComplaints({ customerId: req.user.id });
      return res.status(200).json({ success: true, message: 'My complaints', data: rows, count: rows.length });
    }
    const filters = {};
    if (req.query.stallId) filters.stallId = parseInt(req.query.stallId);
    if (req.query.status) filters.status = req.query.status;
    const rows = await complaintModel.getAllComplaints(filters);
    res.status(200).json({ success: true, message: 'Complaints retrieved', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getMyComplaints(req, res, next) {
  try {
    const rows = await complaintModel.getAllComplaints({ customerId: req.user.id });
    res.status(200).json({ success: true, message: 'My complaints', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getComplaintById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await complaintModel.getComplaintById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (req.user.role === 'Customer' && row.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view your own complaints' });
    }
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function createComplaint(req, res, next) {
  try {
    const { stallId, subject, description } = req.body;
    const customerId = req.user.id;
    const exists = await complaintModel.stallExists(stallId);
    if (!exists) {
      return res.status(400).json({ success: false, message: 'Stall not found' });
    }
    const created = await complaintModel.createComplaint({
      stallId, customerId, subject, description, status: 'Open',
    });
    res.status(201).json({ success: true, message: 'Complaint submitted', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateComplaint(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const existing = await complaintModel.getComplaintById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Complaint not found' });
    const updated = await complaintModel.updateComplaint(id, { status });
    res.status(200).json({ success: true, message: 'Complaint updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteComplaint(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await complaintModel.getComplaintById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Complaint not found' });
    const ok = await complaintModel.deleteComplaint(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.status(200).json({ success: true, message: 'Complaint deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};
