import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const VideoPlayer = ({ videoData, onDurationChange }) => {
  const videoRef = useRef();
  const hlsRef = useRef(null);

  useEffect(() => {
    if (videoData?.url && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(`http://localhost:5000${videoData.url}`);
      hls.attachMedia(videoRef.current);
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }
  }, [videoData]);

  useEffect(() => {
    if (videoRef.current) {
      const handleLoadedMetadata = () => {
        onDurationChange(videoRef.current.duration || 0);
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [videoData, onDurationChange]);

  return (
    <video ref={videoRef} controls style={{ width: '100%' }} />
  );
};

export default VideoPlayer; 