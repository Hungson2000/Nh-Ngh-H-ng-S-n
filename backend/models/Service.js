const mongoose = require('mongoose');

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

module.exports = mongoose.model('Service', ServiceSchema);
