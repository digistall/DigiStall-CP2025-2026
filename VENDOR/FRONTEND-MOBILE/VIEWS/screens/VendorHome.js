import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ApiService from '@vendor-mobile/SERVICES/ApiService';
import UserStorageService from '@vendor-mobile/SERVICES/UserStorageService';
import LogoutLoadingScreen from '@vendor-mobile/COMPONENTS/Common/LogoutLoadingScreen';

const VendorHome = () => {
  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Prevent multiple clicks
    if (isLoggingOut) {
      console.log('⏳ Logout already in progress, ignoring...');
      return;
    }
    
    // Show logout loading screen
    setIsLoggingOut(true);
    
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
      
      // Add small delay to show the animation (1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear local storage
      await UserStorageService.clearUserData();
    } catch (error) {
      console.error('Error during logout:', error);
      await UserStorageService.clearUserData();
    } finally {
      setIsLoggingOut(false);
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

        {/* Logout Loading Screen */}
        <LogoutLoadingScreen 
          visible={isLoggingOut}
          message="Logging out..."
          subMessage="Please wait while we securely log you out"
        />
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