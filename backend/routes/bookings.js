const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// GET tất cả đặt phòng
router.get('/', async (req, res) => {
  const data = await Booking.find().sort({ _id: -1 });
  res.json(data);
});

// POST tạo đặt phòng mới
router.post('/', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.json({ success: true, booking });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// PUT cập nhật đặt phòng (đổi trạng thái...)
router.put('/:id', async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(booking);
});

module.exports = router;
