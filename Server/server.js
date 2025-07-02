const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const videoRoutes = require('./routes/videoRoutes');
const timestampRoutes = require('./routes/timestampRoutes');
const m3u8videoRoutes =  require('./routes/m3u8videoRoutes')

const app = express();
const PORT = 5000;
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"));

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/videos', videoRoutes);
app.use('/api/m3u8-with-markers',m3u8videoRoutes);
app.use('/api/timestamp', timestampRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
