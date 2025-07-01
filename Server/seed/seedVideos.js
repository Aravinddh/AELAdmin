const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Movie = require('../models/Movie');

const ASSETS_DIR = path.join(__dirname, '../assets');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log(' Connected to MongoDB');

    const folders = fs.readdirSync(ASSETS_DIR, { withFileTypes: true }).filter(dirent => dirent.isDirectory());
    let addedCount = 0;

    for (const folder of folders) {
      const folderName = folder.name;
      const folderPath = path.join(ASSETS_DIR, folderName);
      const files = fs.readdirSync(folderPath);

      const m3u8File = files.find(f => f.endsWith('.m3u8'));
      const thumbnailFile = files.find(f => f.match(/\.(jpg|jpeg|png)$/i));

      if (!m3u8File) {
        console.warn(`Skipping "${folderName}" — no .m3u8 file found.`);
        continue;
      }

      const title = folderName.replace(/_/g, ' ');
      const thumbnail = thumbnailFile ? `/assets/${folderName}/${thumbnailFile}` : null;
      const url = `/assets/${folderName}/${m3u8File}`;
      const m3u8Path = `assets/${folderName}/${m3u8File}`;

      const exists = await Movie.findOne({ url });
      if (exists) {
        console.log(`Skipping existing movie: ${title}`);
        continue;
      }

      await Movie.create({
        title,
        thumbnail,
        url,
        m3u8Path
      });

      console.log(`Added: ${title}`);
      addedCount++;
    }

    console.log(`\nSeeding complete. ${addedCount} movie(s) added.`);
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error('MongoDB error:', err);
  });
