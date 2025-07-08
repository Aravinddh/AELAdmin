import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Platform, KeyboardAvoidingView } from 'react-native';
import GradientText from '../GradientText';
import Description from '../Description';
import Logo from "../icons/CanvasLogo";
import axios from 'axios';
import MovieCard from '../MovieCard';
import { BASE_URL } from '../config';

export default function HomeScreen({ navigation }) {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/videos`) 
      .then(res => {
        console.log('HomeScreen - Videos received:', res.data);
        console.log('HomeScreen - First movie structure:', res.data[0]);
        setMovies(res.data);
      })
      .catch(err => console.error('Error fetching videos:', err));
  }, []);

  const handleMoviePress = (movie) => {
    console.log('HomeScreen - Movie pressed:', movie);
    console.log('HomeScreen - movieId being passed:', movie.id);
    console.log('HomeScreen - movieId type:', typeof movie.id);
    navigation.navigate('MoviePlayer', { movieId: movie.id });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <Logo width={50} height={50} />
            <GradientText text="Hook them before they scroll" style={styles.headingRight} />
          </View>
          <Description />
          {movies.map(movie => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              thumbnail={movie.thumbnail}
              onPress={() => handleMoviePress(movie)}
            />
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: { flex: 1 },
  container: { padding: 20, alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'center',
    width: '100%',
    paddingTop: Platform.OS === 'android' ? 30 : 15,
    marginTop:10,
    marginBottom:25,
    paddingBottom: 10,
  },
  headingRight: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 2,
    flexShrink: 1,
  },
});
