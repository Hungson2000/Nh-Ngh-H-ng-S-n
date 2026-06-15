const express = require('express');
const router = express.Router();
const Promo = require('../models/Promo');

// GET tất cả khuyến mãi
router.get('/', async (req, res) => {
  const data = await Promo.find().sort({ _id: -1 });
  res.json(data);
});

// POST tạo khuyến mãi mới
router.post('/', async (req, res) => {
  const promo = new Promo(req.body);
  await promo.save();
  res.json({ success: true, promo });
});

// DELETE xóa khuyến mãi
router.delete('/:id', async (req, res) => {
  await Promo.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
