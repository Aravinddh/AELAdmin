const Movie = require('../models/Movie');
const fs = require('fs');
const path = require('path');
const m3u8Parser = require('m3u8-parser');

exports.getVideos = async (req, res) => {
  try {
    const videos = await Movie.find({});
    res.json(videos.map(({ _id, title, thumbnail, url }) => ({
      id: _id,
      title,
      thumbnail,
      url
    })));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching videos' });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    console.log("connected");
    const video = await Movie.findById(req.params.id);
    console.log(video._id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.json({
      success: true,
      video: {
        id: video._id,
        title: video.title,
        thumbnail: video.thumbnail,
        url: video.url,
        m3u8Path: video.m3u8Path,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getClosestSegments = async (req, res) => {
  const { videoId, timestamp } = req.body;
//   console.log(videoId);
  const video = await Movie.findById(videoId);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

  const m3u8Path = path.join(__dirname, '..', video.m3u8Path);
  if (!fs.existsSync(m3u8Path)) return res.status(404).json({ success: false, message: 'Playlist not found' });

  const m3u8Content = fs.readFileSync(m3u8Path, 'utf8');
  const parser = new m3u8Parser.Parser();
  parser.push(m3u8Content);
  parser.end();

  const segments = parser.manifest.segments || [];
  let currentTime = 0;
  const segmentInfos = segments.map(seg => ({
    uri: seg.uri,
    duration: seg.duration,
    start: currentTime,
    end: currentTime += seg.duration
  }));

  segmentInfos.sort((a, b) => Math.abs(a.start - timestamp) - Math.abs(b.start - timestamp));
  const closest = segmentInfos.slice(0, 4).sort((a, b) => a.start - b.start);
  console.log(segments);
  res.json({ success: true, segments: closest });
};
