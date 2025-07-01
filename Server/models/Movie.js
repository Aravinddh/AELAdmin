const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: String,
  thumbnail: String,
  url: String,
  m3u8Path: String
});

module.exports = mongoose.model('Movie', MovieSchema);
