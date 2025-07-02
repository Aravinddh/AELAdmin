
import React from 'react';
import { Text, StyleSheet } from 'react-native';

export default function Description() {
  return (
    <Text style={styles.description}>
     Unlock new ways to increase retention within your video player.
    </Text>
  );
}

const styles = StyleSheet.create({
  description: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom:15
  },
});
