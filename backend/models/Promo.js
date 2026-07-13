const mongoose = require('mongoose');

const PromoSchema = new mongoose.Schema({
  from:    String,
  to:      String,
  apply:   String,
  percent: Number,
  label:   String
});

module.exports = mongoose.model('Promo', PromoSchema);
