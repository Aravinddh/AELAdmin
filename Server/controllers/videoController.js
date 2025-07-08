const Movie = require('../models/Movie');
const fs = require('fs');
const path = require('path');
const m3u8Parser = require('m3u8-parser');

exports.getVideos = async (req, res) => {
  try {
    console.log('VideoController - getVideos called');
    const videos = await Movie.find({});
    console.log('VideoController - Found videos:', videos.length);
    console.log('VideoController - First video _id:', videos[0]?._id);
    console.log('VideoController - First video _id type:', typeof videos[0]?._id);
    
    const mappedVideos = videos.map(({ _id, title, thumbnail, url }) => ({
      id: _id,
      title,
      thumbnail,
      url
    }));
    
    console.log('VideoController - Mapped first video:', mappedVideos[0]);
    res.json(mappedVideos);
  } catch (err) {
    console.error('VideoController - Error in getVideos:', err);
    res.status(500).json({ success: false, message: 'Error fetching videos' });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    console.log('VideoController - getVideoById called with ID:', req.params.id);
    console.log('VideoController - ID type:', typeof req.params.id);
    
    const video = await Movie.findById(req.params.id);
    if (!video) {
      console.log('VideoController - Video not found for ID:', req.params.id);
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    console.log('VideoController - Found video:', video.title);
    console.log('VideoController - Video _id:', video._id);
    
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
    
    console.log('VideoController - Sending response:', response);
    res.json(response);
  } catch (err) {
    console.error('VideoController - Error in getVideoById:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
