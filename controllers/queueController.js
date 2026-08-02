// controllers/queueController.js
const queueModel = require('../models/queueModel');
const stallModel = require('../models/stallModel');

async function getAllQueueEntries(req, res, next) {
  try {
    const stallId = req.query.stallId ? parseInt(req.query.stallId) : null;
    const status = req.query.status || null;
    const rows = await queueModel.getAllQueueEntries(stallId, status);
    res.status(200).json({ success: true, message: 'Queue entries retrieved', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getQueueEntryById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await queueModel.getQueueEntryById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Queue entry not found' });
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function joinQueue(req, res, next) {
  try {
    const { stallId } = req.body;
    const customerId = req.user.id;

    const exists = await queueModel.stallExists(stallId);
    if (!exists) {
      return res.status(400).json({ success: false, message: 'Stall not found' });
    }
    const existing = await queueModel.getPositionForCustomer(stallId, customerId);
    if (existing && existing.Status === 'Waiting') {
      return res.status(409).json({
        success: false,
        message: 'You are already in the queue for this stall',
        data: existing,
      });
    }
    const queueNumber = await queueModel.getNextQueueNumber(stallId);
    const created = await queueModel.createQueueEntry({
      stallId, customerId, queueNumber, status: 'Waiting',
    });
    res.status(201).json({ success: true, message: 'Joined queue', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateQueueEntry(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const existing = await queueModel.getQueueEntryById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Queue entry not found' });

    let isOwner = false;
    if (req.user.role === 'Customer' && existing.CustomerId === req.user.id) isOwner = true;
    if (req.user.role === 'Vendor') {
      const ownerStalls = await stallModel.getStallsByOwnerId(req.user.id);
      isOwner = ownerStalls.some((s) => s.StallId === existing.StallId);
    }
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'You cannot update this queue entry' });
    }

    const updated = await queueModel.updateQueueEntry(id, { status });
    res.status(200).json({ success: true, message: 'Queue entry updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteQueueEntry(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await queueModel.getQueueEntryById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Queue entry not found' });

    let canDelete = false;
    if (req.user.role === 'Customer' && existing.CustomerId === req.user.id) canDelete = true;
    if (req.user.role === 'Vendor') {
      const ownerStalls = await stallModel.getStallsByOwnerId(req.user.id);
      canDelete = ownerStalls.some((s) => s.StallId === existing.StallId);
    }
    if (!canDelete) {
      return res.status(403).json({ success: false, message: 'You cannot delete this queue entry' });
    }
    const ok = await queueModel.deleteQueueEntry(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Queue entry not found' });
    res.status(200).json({ success: true, message: 'Queue entry removed' });
  } catch (err) {
    next(err);
  }
}

async function getPosition(req, res, next) {
  try {
    const stallId = parseInt(req.params.stallId);
    const customerId = req.user.id;
    const position = await queueModel.getPositionForCustomer(stallId, customerId);
    if (!position) {
      return res.status(404).json({ success: false, message: 'You are not in this stall\'s queue' });
    }
    res.status(200).json({ success: true, data: position });
  } catch (err) {
    next(err);
  }
}

async function getStallQueueStatus(req, res, next) {
  try {
    const stallId = parseInt(req.params.stallId);
    const status = await queueModel.getStallQueueStatus(stallId);
    res.status(200).json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllQueueEntries,
  getQueueEntryById,
  joinQueue,
  updateQueueEntry,
  deleteQueueEntry,
  getPosition,
  getStallQueueStatus,
};
