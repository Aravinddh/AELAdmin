import React, { useEffect, useState } from 'react';
import './LandingPage.css';
import VideoPlayerModal from './VideoPlayerModal';

const LandingPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/videos')
      .then((res) => res.json())
      .then((data) => {
        setVideos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOpenModal = (video) => {
    setSelectedVideo(video);
  };

  return (
    <div className="landing-container">
      <h1 className="landing-title">Welcome to the AEL admin LandingPage</h1>
      {loading ? (
        <p>Loading videos...</p>
      ) : (
        <div className="video-grid">
          {videos.map((video) => (
            <div
              className="video-card"
              key={video.id}
              onClick={() => handleOpenModal(video)}
              style={{ cursor: 'pointer' }}
            >
              <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
              <div className="video-info">
                <h2 className="video-title">{video.title}</h2>
              </div>
            </div>
          ))}
        </div>
      )}
      <VideoPlayerModal
        open={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        m3u8Url={selectedVideo ? `http://localhost:5000${selectedVideo.url}` : null}
        videoId={selectedVideo ? selectedVideo.id : null}
      />
    </div>
  );
};

export default LandingPage; 