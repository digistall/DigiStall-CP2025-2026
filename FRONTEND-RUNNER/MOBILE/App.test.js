import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  console.log('✅ Minimal app loaded successfully!');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 DigiStall is Working!</Text>
      <Text style={styles.subtitle}>Expo Go Connection Successful</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002181',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
  },
});
