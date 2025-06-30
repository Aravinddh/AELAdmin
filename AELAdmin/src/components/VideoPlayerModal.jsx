import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const VideoPlayerModal = ({ open, onClose, m3u8Url, videoId }) => {
  const videoRef = useRef();
  const [timestamp, setTimestamp] = useState(0);
  const [duration, setDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [closestSegments, setClosestSegments] = useState([]);
  const hlsRef = useRef(null);

  // Clean up all state when modal closes
  useEffect(() => {
    if (!open) {
      setTimestamp(0);
      setDuration(0);
      setSubmitting(false);
      setSuccess(false);
      setClosestSegments([]);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (open && m3u8Url && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(m3u8Url);
      hls.attachMedia(videoRef.current);
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
  }, [open, m3u8Url]);

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setTimestamp(0);
      setSuccess(false);
      setDuration(0);
      const handleLoadedMetadata = () => {
        setDuration(videoRef.current.duration || 0);
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [open, m3u8Url]);

  // Fetch closest segments when timestamp or videoId changes
  useEffect(() => {
    if (open && videoId != null && duration > 0) {
      fetch('http://localhost:5000/api/closest-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, timestamp }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setClosestSegments(data.segments);
          } else {
            setClosestSegments([]);
          }
        })
        .catch(() => setClosestSegments([]));
    } else {
      setClosestSegments([]);
    }
  }, [timestamp, videoId, open, duration]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    try {
      const res = await fetch('http://localhost:5000/api/timestamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          timestamp: Number(timestamp),
        }),
      });
      if (res.ok) {
        setSuccess(true);
      }
    } catch {
      // Error handling can be added here if needed
    }
    setSubmitting(false);
  };

  // Helper to get the min and max of the closest segments
  const getSegmentRange = () => {
    if (!closestSegments.length) return null;
    const starts = closestSegments.map(seg => seg.start);
    const ends = closestSegments.map(seg => seg.start + seg.duration);
    return {
      min: Math.min(...starts),
      max: Math.max(...ends),
      segments: closestSegments.map(seg => ({ start: seg.start, end: seg.start + seg.duration }))
    };
  };

  // Render segment highlights as a bar below the video
  const renderSegmentBar = () => {
    if (!duration || !closestSegments.length) return null;
    const range = getSegmentRange();
    if (!range) return null;
    return (
      <div style={{ position: 'relative', width: '100%', height: 12, margin: '8px 0 16px 0', background: '#444', borderRadius: 6 }}>
        {range.segments.map((seg, idx) => {
          const left = `${(seg.start / duration) * 100}%`;
          const width = `${((seg.end - seg.start) / duration) * 100}%`;
          let bg = '#3ec46d'; // green for range
          if (idx === 0) bg = '#ffe066'; // yellow for start
          if (idx === range.segments.length - 1) bg = '#ff5c5c'; // red for end
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left,
                width,
                height: '100%',
                background: bg,
                borderRadius: 6,
                opacity: 0.85,
                zIndex: 2,
              }}
            />
          );
        })}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ width: '60%' }}>
          <video ref={videoRef} controls style={{ width: '100%' }} />
          {renderSegmentBar()}
        </div>
        <form onSubmit={handleSubmit} style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#222', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <label style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
            Select timestamp:
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={timestamp}
                onChange={e => setTimestamp(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#535bf2', height: '4px' }}
                disabled={duration === 0}
              />
              <span style={{ color: '#535bf2', fontWeight: 'bold', minWidth: 40 }}>{timestamp.toFixed(1)}s</span>
            </div>
          </label>
          {closestSegments.length > 0 && (
            <div style={{ background: '#181a2a', borderRadius: '8px', padding: '1rem', marginTop: '1rem', color: '#fff' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#6e8efb' }}>Closest Segments (Ranges):</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {closestSegments.map((seg, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#535bf2', fontWeight: 'bold' }}>{seg.start.toFixed(2)}s</span>
                    {' - '}
                    <span style={{ color: '#3ec46d', fontWeight: 'bold' }}>{(seg.start + seg.duration).toFixed(2)}s</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || duration === 0}
            style={{
              background: 'linear-gradient(90deg, #535bf2 0%, #6e8efb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.8rem 1.5rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: submitting || duration === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(83,91,242,0.15)',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Timestamp'}
          </button>
          {success && <span style={{ color: 'lightgreen', fontWeight: 'bold' }}>Timestamp submitted!</span>}
        </form>
        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: '#535bf2', color: '#fff', border: 'none',
            borderRadius: '50%', width: 36, height: 36, fontSize: 18,
            cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
