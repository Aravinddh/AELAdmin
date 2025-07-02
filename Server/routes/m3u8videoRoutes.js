const express = require('express');
const router = express.Router();
const {serveM3U8WithMarkers} = require('../controllers/m3u8videoController');

router.get('/:id', serveM3U8WithMarkers);

module.exports = router;
