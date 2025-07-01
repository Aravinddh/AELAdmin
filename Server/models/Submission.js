const mongoose = require('mongoose');

const TimestampSubmissionSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  selections: [
    {
      timestamp: { type: Number, required: true },
      formId: { type: String, required: true },
      selectedSegment: {
        segment: { type: String, required: true },
        start: { type: Number, required: true },
        end: { type: Number, required: true },
        duration: { type: Number, required: true }
      }
    }
  ],
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimestampSubmission', TimestampSubmissionSchema);
