import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../components/ThemeComponents/ThemeContext';

const { width } = Dimensions.get('window');

const SettingsScreen = () => {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="settings-outline" size={64} color={theme.colors.textSecondary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Coming soon...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.06,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SettingsScreen;
