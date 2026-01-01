import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../services/ApiService';
import UserStorageService from '../../services/UserStorageService';

const VendorHome = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      // Get user data before clearing
      const userData = await UserStorageService.getUserData();
      const token = userData?.token;
      const userId = userData?.user?.applicant_id || userData?.user?.id;
      
      // Call logout API to update last_logout in database
      if (token) {
        await ApiService.mobileLogout(token, userId);
        console.log('✅ Logout API called - last_logout updated');
      }
      
      // Clear local storage
      await UserStorageService.clearUserData();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Login as Vendor</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VendorHome;