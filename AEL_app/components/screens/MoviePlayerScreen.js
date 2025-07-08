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
    
    console.log('MoviePlayerScreen - Received movieId:', movieId);
    console.log('MoviePlayerScreen - movieId type:', typeof movieId);
    console.log('MoviePlayerScreen - BASE_URL:', BASE_URL);
    
    useEffect(() => {
        console.log('MoviePlayerScreen - Making API call to:', `${BASE_URL}/api/videos/${movieId}`);
        axios.get(`${BASE_URL}/api/videos/${movieId}`)
            .then(res => {
                console.log('MoviePlayerScreen - Video API response:', res.data);
                setMovie(res.data.video);
                console.log('MoviePlayerScreen - Making M3U8 API call to:', `${BASE_URL}/api/m3u8-with-markers/${movieId}`);
                parseM3U8(`${BASE_URL}/api/m3u8-with-markers/${movieId}`);
            })
            .catch(err => {
                console.error('MoviePlayerScreen - Error fetching video:', err);
                console.error('MoviePlayerScreen - Error response:', err.response?.data);
                console.error('MoviePlayerScreen - Error status:', err.response?.status);
            });
    }, []);

    const parseM3U8 = async (url) => {
        console.log('MoviePlayerScreen - Parsing M3U8 from URL:', url);
        try {
            const res = await fetch(url);
            console.log('MoviePlayerScreen - M3U8 fetch status:', res.status);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const text = await res.text();
            console.log('MoviePlayerScreen - M3U8 content length:', text.length);
            console.log('MoviePlayerScreen - M3U8 first 200 chars:', text.substring(0, 200));
            
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
            console.log('MoviePlayerScreen - Found markers:', newMarkers);
            setMarkers(newMarkers);
        } catch (err) {
            console.error("MoviePlayerScreen - Error parsing M3U8:", err);
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
        console.log('MoviePlayerScreen - No movie data, showing loading indicator');
        return <ActivityIndicator size="large" color="#fff" style={{ flex: 1, backgroundColor: '#000' }} />;
    }
    
    console.log('MoviePlayerScreen - Rendering video player for movie:', movie.title);
    return (
        <View style={styles.container}>
            <GradientText text={movie.title} style={styles.heading} />
            <Video
                ref={videoRef}
                source={{
                    uri: `${BASE_URL}/api/m3u8-with-markers/${movieId}`,
                    overrideFileExtensionAndroid: 'm3u8'
                }}
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

