// controllers/customerProfileController.js
const customerProfileModel = require('../models/customerProfileModel');

async function getOwnProfile(req, res, next) {
  try {
    const profile = await customerProfileModel.getProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function getProfileById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const profile = await customerProfileModel.getProfileById(id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    if (req.user.role === 'Customer' && profile.UserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view your own profile' });
    }
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function createProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const existing = await customerProfileModel.getProfileByUserId(userId);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Profile already exists for this user' });
    }
    const { phone, preferredLanguage, loyaltyPoints } = req.body;
    const created = await customerProfileModel.createCustomerProfile({
      userId, phone, preferredLanguage, loyaltyPoints,
    });
    res.status(201).json({ success: true, message: 'Profile created', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const existing = await customerProfileModel.getProfileByUserId(userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Profile not found' });
    // Loyalty points are server-managed and cannot be modified via this endpoint.
    const { phone, preferredLanguage } = req.body;
    const updated = await customerProfileModel.updateCustomerProfile(userId, {
      phone, preferredLanguage,
    });
    res.status(200).json({ success: true, message: 'Profile updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteProfile(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await customerProfileModel.getProfileById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Profile not found' });
    if (req.user.role === 'Customer' && existing.UserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own profile' });
    }
    const ok = await customerProfileModel.deleteCustomerProfile(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.status(200).json({ success: true, message: 'Profile deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOwnProfile,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
};
