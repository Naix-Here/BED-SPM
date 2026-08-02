// controllers/vendorProfileController.js
const vendorProfileModel = require('../models/vendorProfileModel');

async function getOwnProfile(req, res, next) {
  try {
    const profile = await vendorProfileModel.getProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

async function getProfileById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const profile = await vendorProfileModel.getProfileById(id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    if (req.user.role === 'Vendor' && profile.UserId !== req.user.id) {
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
    const existing = await vendorProfileModel.getProfileByUserId(userId);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Profile already exists for this user' });
    }
    const { businessName, contactNumber, stallId } = req.body;
    const created = await vendorProfileModel.createVendorProfile({
      userId, businessName, contactNumber, stallId,
    });
    res.status(201).json({ success: true, message: 'Profile created', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const existing = await vendorProfileModel.getProfileByUserId(userId);
    if (!existing) return res.status(404).json({ success: false, message: 'Profile not found' });
    const { businessName, contactNumber, stallId } = req.body;
    const updated = await vendorProfileModel.updateVendorProfile(userId, {
      businessName, contactNumber, stallId,
    });
    res.status(200).json({ success: true, message: 'Profile updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteProfile(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await vendorProfileModel.getProfileById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Profile not found' });
    const ok = await vendorProfileModel.deleteVendorProfile(id);
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
