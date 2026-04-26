const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Hungson:Hungson2005%40@cluster0.twummsi.mongodb.net/nhanghi?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Kết nối MongoDB thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối:', err));

// ===== MODELS =====

const BookingSchema = new mongoose.Schema({
  code:      { type: String, unique: true },
  name:      String,
  phone:     String,
  email:     String,
  room:      String,
  checkin:   String,
  checkout:  String,
  nights:    Number,
  total:     Number,
  status:    { type: String, default: 'new' },
  createdAt: { type: String, default: () => new Date().toLocaleDateString('vi') }
});

const ReviewSchema = new mongoose.Schema({
  name:  String,
  text:  String,
  room:  String,
  star:  Number,
  date:  { type: String, default: () => new Date().toLocaleDateString('vi') }
});

const ServiceSchema = new mongoose.Schema({
  name:     String,
  room:     String,
  date:     String,
  time:     String,
  services: String,
  total:    Number,
  note:     String,
  status:   { type: String, default: 'new' },
  createdAt:{ type: String, default: () => new Date().toLocaleDateString('vi') }
});

const PromoSchema = new mongoose.Schema({
  from:    String,
  to:      String,
  apply:   String,
  percent: Number,
  label:   String
});

const Booking     = mongoose.model('Booking', BookingSchema);
const Review      = mongoose.model('Review', ReviewSchema);
const Service     = mongoose.model('Service', ServiceSchema);
const Promo       = mongoose.model('Promo', PromoSchema);

// ===== API ĐẶT PHÒNG =====
app.get('/api/bookings', async (req, res) => {
  const data = await Booking.find().sort({ _id: -1 });
  res.json(data);
});

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.json({ success: true, booking });
  } catch(e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(booking);
});

// ===== API ĐÁNH GIÁ =====
app.get('/api/reviews', async (req, res) => {
  const data = await Review.find().sort({ _id: -1 });
  res.json(data);
});

app.post('/api/reviews', async (req, res) => {
  const review = new Review(req.body);
  await review.save();
  res.json({ success: true, review });
});

app.delete('/api/reviews/:id', async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ===== API DỊCH VỤ =====
app.get('/api/services', async (req, res) => {
  const data = await Service.find().sort({ _id: -1 });
  res.json(data);
});

app.post('/api/services', async (req, res) => {
  const service = new Service(req.body);
  await service.save();
  res.json({ success: true, service });
});

app.put('/api/services/:id', async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(service);
});

// ===== API KHUYẾN MÃI =====
app.get('/api/promos', async (req, res) => {
  const data = await Promo.find().sort({ _id: -1 });
  res.json(data);
});

app.post('/api/promos', async (req, res) => {
  const promo = new Promo(req.body);
  await promo.save();
  res.json({ success: true, promo });
});

app.delete('/api/promos/:id', async (req, res) => {
  await Promo.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ===== CHẠY SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});