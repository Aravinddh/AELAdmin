const express = require('express');
const router = express.Router();
const { submitTimestamp , getClosestSegments, getFormsForVideo, updateFormById, deleteFormById } = require('../controllers/timestampController');

router.post('/', submitTimestamp);
router.post('/closest-segments', getClosestSegments);


router.get('/:videoId', getFormsForVideo); // Get all forms for a video
router.put('/:formId', updateFormById);    // Update a form by formId
router.delete('/:formId', deleteFormById); // Delete a form by formId

module.exports = router;