import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { Video } from 'expo-av';
import GradientText from '../GradientText';
import EmailFormModal from '../EmailFormModal';
import axios from 'axios';
import { BASE_URL } from '../config';
import { Marker } from 'react-native-svg';

export default function MoviePlayerScreen({ route }) {
  const { movieId } = route.params;
  const [movie, setMovie] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentFormId, setCurrentFormId] = useState(null);
  const videoRef = useRef();
  const shownMarkers = useRef(new Set());
  const [email, setEmail] = useState('');

  useEffect(() => {
    axios.get(`${BASE_URL}/api/videos/${movieId}`)
      .then(res => {
        setMovie(res.data.video);
        parseM3U8(`${BASE_URL}/api/m3u8-with-markers/${movieId}`);
      })
      .catch(err => console.error('Error fetching video:', err));
  }, []);

  const parseM3U8 = async (url) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const lines = text.split('\n');
      const newMarkers = [];

      for (let line of lines) {
        if (line.startsWith('#EXT-X-DATERANGE')) {
          const formId = (line.match(/X-FORM-ID="(.*?)"/) || [])[1];
          const timestamp = parseFloat((line.match(/X-TIMESTAMP="(.*?)"/) || [])[1]);
          if (formId && timestamp) {
            newMarkers.push({ formId, time: timestamp });
          }
        }
      }
      setMarkers(newMarkers);
    } catch (err) {
      console.error("Error parsing M3U8:", err);
    }
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (!status.isLoaded || !status.isPlaying) return;

    const currentTime = status.positionMillis / 1000;

    for (let marker of markers) {
      if (currentTime >= marker.time && !shownMarkers.current.has(marker.formId)) {
        shownMarkers.current.add(marker.formId);
        videoRef.current.pauseAsync();
        setCurrentFormId(marker.formId);
        setShowForm(true);
        break;
      }
    }
  };

  const handleFormSubmit = () => {
    console.log('Form submitted:', currentFormId);
    setShowForm(false);
    setCurrentFormId(null);
    videoRef.current.playAsync();
  };

  if (!movie) {
    return <ActivityIndicator size="large" color="#fff" style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <View style={styles.container}>
      <GradientText text={movie.title} style={styles.heading} />
      <Video
        ref={videoRef}
        source={{ uri: `${BASE_URL}/api/m3u8-with-markers/${movieId}`,
        overrideFileExtensionAndroid: 'm3u8'  }}
         useNativeControls={true} 
        resizeMode="contain"
        style={styles.video}
        shouldPlay
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
      {showForm && (
    <EmailFormModal
      email={email}
      visible={showForm}
      onEmailChange={setEmail}
      onSubmit={handleFormSubmit}
    />
)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  video: {
    width: '95%',
    height: 250,
  },
});
