import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import Lock from './icons/Lock';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from 'react-native';

export default function EmailFormModal({ visible, email, onEmailChange, onSubmit, onSkip }) {
  const { width, height } = useWindowDimensions();
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!email.trim()) {
      setError('Please enter the email');
      return;
    }
    setError('');
    onSubmit();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={120} tint="dark" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={[styles.overlay, { width, minHeight: height }]}>
            <Lock width={80} height={80} stroke="#fff" fill="none" />

            <Text style={styles.title}>Enter the Email to continue watching</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                onEmailChange(text);
                if (error) setError('');
              }}
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#ccc"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <LinearGradient
              colors={['#FD9D43', '#EDBF1B', '#3FD1CC', '#5B5FD1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonBorder}
            >
              <TouchableOpacity onPress={handleSubmit} style={styles.innerButton}>
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  label: {
    alignSelf: 'flex-start',
    color: '#ccc',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 5,
    marginLeft: '5%',
  },
  input: {
    backgroundColor: 'rgba(83, 83, 83, 0.6)',
    width: '90%',
    padding: 12,
    marginBottom: 15,
    borderRadius: 30,
    color: 'white',
  },
  error: {
    color: 'red',
    alignSelf: 'flex-start',
    marginLeft: '5%',
    marginBottom: 10,
  },
  buttonBorder: {
    width: '60%',
    padding: 2.5,
    borderRadius: 30,
  },
  innerButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
