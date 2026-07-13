const mongoose = require('mongoose');

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

module.exports = mongoose.model('Booking', BookingSchema);
