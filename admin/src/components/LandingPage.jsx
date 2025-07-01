import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

const fallbackImage = '/pause-fallback.png'; // make sure this exists in `public/`

const LandingPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/videos')
      .then(res => res.json())
      .then(data => {
        setVideos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#111', minHeight: '100vh', padding: '3rem', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold', color: '#6e8efb' }}>
        Welcome to the AEL Admin Landing Page
      </h1>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading videos...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '2rem',
            padding: '1rem',
          }}
        >
          {videos.map(video => (
            <div
              key={video._id || video.id}
              onClick={() => navigate(`/videos/${video._id || video.id}`)}
              style={{
                cursor: 'pointer',
                background: '#222',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img
                src={video.thumbnail ? `http://localhost:5000${video.thumbnail}` : fallbackImage}
                alt={video.title}
                onError={(e) => { e.target.src = fallbackImage }}
                style={{
                  width: '100%',
                  height: '160px',
                  objectFit: 'cover',
                }}
              />
              <div style={{ padding: '1rem' }}>
                <h2 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.5rem' }}>{video.title}</h2>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandingPage;
