const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// GET tất cả đơn dịch vụ
router.get('/', async (req, res) => {
  const data = await Service.find().sort({ _id: -1 });
  res.json(data);
});

// POST tạo đơn dịch vụ mới
router.post('/', async (req, res) => {
  const service = new Service(req.body);
  await service.save();
  res.json({ success: true, service });
});

// PUT cập nhật đơn dịch vụ (đổi trạng thái...)
router.put('/:id', async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(service);
});

module.exports = router;
