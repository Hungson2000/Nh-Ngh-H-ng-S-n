const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ===== KẾT NỐI MONGODB =====
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Thiếu MONGO_URI trong file .env');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Kết nối MongoDB thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối:', err));
  if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  Thiếu GEMINI_API_KEY trong .env — tính năng tư vấn AI sẽ không hoạt động.');
}

// ===== ROUTES =====
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/services', require('./routes/services'));
app.use('/api/promos', require('./routes/promos'));
app.use('/api/ai', require('./routes/ai'));

// ===== CHẠY SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
