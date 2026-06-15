const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  name:  String,
  text:  String,
  room:  String,
  star:  Number,
  date:  { type: String, default: () => new Date().toLocaleDateString('vi') }
});

module.exports = mongoose.model('Review', ReviewSchema);
