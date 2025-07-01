const express = require('express');
const router = express.Router();
const { submitTimestamp , getClosestSegments } = require('../controllers/timestampController');

router.post('/', submitTimestamp);
router.post('/closest-segments', getClosestSegments);

module.exports = router;
