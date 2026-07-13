const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET tất cả đánh giá
router.get('/', async (req, res) => {
  const data = await Review.find().sort({ _id: -1 });
  res.json(data);
});

// POST thêm đánh giá mới
router.post('/', async (req, res) => {
  const review = new Review(req.body);
  await review.save();
  res.json({ success: true, review });
});

// DELETE xóa đánh giá
router.delete('/:id', async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
