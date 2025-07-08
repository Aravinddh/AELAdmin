const Movie = require('../models/Movie');
const fs = require('fs');
const path = require('path');
const m3u8Parser = require('m3u8-parser');

exports.getVideos = async (req, res) => {
  try {
    const videos = await Movie.find({});
    
    const mappedVideos = videos.map(({ _id, title, thumbnail, url }) => ({
      id: _id,
      title,
      thumbnail,
      url
    }));

    res.json(mappedVideos);
  } catch (err) {
    console.error('VideoController - Error in getVideos:', err);
    res.status(500).json({ success: false, message: 'Error fetching videos' });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    
    const video = await Movie.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const response = {
      success: true,
      video: {
        id: video._id,
        title: video.title,
        thumbnail: video.thumbnail,
        url: video.url,
        m3u8Path: video.m3u8Path,
      },
    };

    res.json(response);
  } catch (err) {
    console.error('VideoController - Error in getVideoById:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
