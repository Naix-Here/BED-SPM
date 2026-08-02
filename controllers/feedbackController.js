// controllers/feedbackController.js
const feedbackModel = require('../models/feedbackModel');

async function getAllFeedback(req, res, next) {
  try {
    const stallId = req.query.stallId ? parseInt(req.query.stallId) : null;
    const rows = await feedbackModel.getAllFeedback(stallId);
    res.status(200).json({
      success: true,
      message: 'Feedback retrieved successfully',
      data: rows,
      count: rows.length,
    });
  } catch (err) {
    next(err);
  }
}

async function getFeedbackById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await feedbackModel.getFeedbackById(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function createFeedback(req, res, next) {
  try {
    const { stallId, rating, comment } = req.body;
    const customerId = req.user.id;

    const exists = await feedbackModel.stallExists(stallId);
    if (!exists) {
      return res.status(400).json({ success: false, message: 'Stall not found' });
    }
    const created = await feedbackModel.createFeedback({ stallId, customerId, rating, comment });
    res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateFeedback(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { rating, comment } = req.body;
    const existing = await feedbackModel.getFeedbackById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    if (req.user.role === 'Customer' && existing.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own feedback' });
    }
    const updated = await feedbackModel.updateFeedback(id, { rating, comment });
    res.status(200).json({ success: true, message: 'Feedback updated successfully', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteFeedback(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await feedbackModel.getFeedbackById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    if (req.user.role === 'Customer' && existing.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own feedback' });
    }
    const ok = await feedbackModel.deleteFeedback(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }
    res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
