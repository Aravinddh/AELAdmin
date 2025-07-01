const express = require('express');
const router = express.Router();
const { getVideos,getVideoById} = require('../controllers/videoController');

router.get('/', getVideos);
router.get('/:id',getVideoById);

module.exports = router;
