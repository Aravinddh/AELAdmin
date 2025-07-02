import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, View } from 'react-native';
import { BASE_URL } from './config';

export default function MovieCard({ title, thumbnail, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: `${BASE_URL}${thumbnail}` }} style={styles.thumbnail} />
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 10,
    width: '100%',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  title: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
