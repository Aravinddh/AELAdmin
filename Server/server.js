const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const m3u8Parser = require('m3u8-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const ASSETS_DIR = path.join(__dirname, 'assets');

// In-memory storage for videos and submitted timestamps
let videosList = [];
let submittedTimestamps = [];

function getVideosList() {
  const videos = [];
  const folders = fs.readdirSync(ASSETS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());
  let idCounter = 1;
  folders.forEach(folder => {
    const folderPath = path.join(ASSETS_DIR, folder.name);
    const files = fs.readdirSync(folderPath);
    const m3u8File = files.find(f => f.endsWith('.m3u8'));
    if (m3u8File) {
      videos.push({
        id: idCounter,
        title: folder.name.replace(/_/g, ' '),
        thumbnail: 'https://via.placeholder.com/320x180?text=' + encodeURIComponent(folder.name),
        url: `/assets/${folder.name}/${m3u8File}`,
        m3u8Path: path.join('assets', folder.name, m3u8File)
      });
      idCounter++;
    }
  });
  return videos;
}

// Initialize videosList at server start
videosList = getVideosList();

app.use('/assets', express.static(ASSETS_DIR));

app.get('/api/videos', (req, res) => {
  // Refresh the list in case new videos are added
  videosList = getVideosList();
  res.json(videosList.map(({id, title, thumbnail, url}) => ({id, title, thumbnail, url})));
});

app.post('/api/timestamp', (req, res) => {
  const { videoId, timestamp } = req.body;
  const video = videosList.find(v => v.id === videoId);
  if (!video) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }
  submittedTimestamps.push({ videoId, timestamp, receivedAt: new Date().toISOString() });
  console.log('Received timestamp:', { videoId, timestamp });
  res.json({ success: true });
});

app.post('/api/closest-segments', (req, res) => {
  const { videoId, timestamp } = req.body;
  const video = videosList.find(v => v.id === videoId);
  if (!video) {
    return res.status(404).json({ success: false, message: 'Video not found' });
  }
  const m3u8Path = path.join(__dirname, video.m3u8Path);
  if (!fs.existsSync(m3u8Path)) {
    return res.status(404).json({ success: false, message: 'Playlist not found' });
  }
  const m3u8Content = fs.readFileSync(m3u8Path, 'utf8');
  const parser = new m3u8Parser.Parser();
  parser.push(m3u8Content);
  parser.end();
  const segments = parser.manifest.segments || [];
  // Calculate start times for each segment
  let currentTime = 0;
  const segmentInfos = segments.map(seg => {
    const info = {
      uri: seg.uri,
      duration: seg.duration,
      start: currentTime
    };
    currentTime += seg.duration;
    return info;
  });
  // Find the 4 segments closest to the timestamp
  segmentInfos.sort((a, b) => Math.abs(a.start - timestamp) - Math.abs(b.start - timestamp));
  const closestSegments = segmentInfos.slice(0, 4).sort((a, b) => a.start - b.start);
  res.json({ success: true, segments: closestSegments });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
