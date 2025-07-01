const Movie = require("../models/Movie");
const fs = require("fs");
const path = require("path");
const m3u8Parser = require("m3u8-parser");
let submittedTimestamps = [];
const TimestampSubmission = require("../models/Submission");

exports.submitTimestamp = async (req, res) => {
  try {
    const { videoId, selections } = req.body;
    console.log(selections);

    const video = await Movie.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const processedSelections = selections.map((sel) => {
      const segmentInfo = sel.selectedSegment;
      if (!segmentInfo || !segmentInfo.uri) {
        throw new Error("Invalid segment selection");
      }

      return {
        timestamp: sel.timestamp,
        formId: sel.formId,
        selectedSegment: {
          segment: segmentInfo.uri,
          start: segmentInfo.start,
          end: segmentInfo.end,
          duration: segmentInfo.duration,
        },
      };
    });

    const existingSubmission = await TimestampSubmission.findOne({ videoId });

    if (existingSubmission) {
      existingSubmission.selections.push(...processedSelections);
      await existingSubmission.save();
      return res.status(200).json({ success: true, message: "Selections added to existing submission!" });
    } else {
      const newSubmission = new TimestampSubmission({
        videoId,
        selections: processedSelections,
      });

      await newSubmission.save();
      return res.status(200).json({ success: true, message: "New timestamp submission created!" });
    }
  } catch (err) {
    console.error("Error submitting timestamp:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getClosestSegments = async (req, res) => {
  const { videoId, timestamp } = req.body;
  console.log(videoId);
  const video = await Movie.findById(videoId);
  if (!video)
    return res.status(404).json({ success: false, message: "Video not found" });

  const m3u8Path = path.join(__dirname, "..", video.m3u8Path);
  if (!fs.existsSync(m3u8Path))
    return res
      .status(404)
      .json({ success: false, message: "Playlist not found" });

  const m3u8Content = fs.readFileSync(m3u8Path, "utf8");
  const parser = new m3u8Parser.Parser();
  parser.push(m3u8Content);
  parser.end();

  const segments = parser.manifest.segments || [];
  let currentTime = 0;
  const segmentInfos = segments.map((seg) => ({
    uri: seg.uri,
    duration: seg.duration,
    start: currentTime,
    end: (currentTime += seg.duration),
  }));

  segmentInfos.sort(
    (a, b) => Math.abs(a.start - timestamp) - Math.abs(b.start - timestamp)
  );
  const closest = segmentInfos.slice(0, 4).sort((a, b) => a.start - b.start);
  res.json({ success: true, segments: closest });
};
