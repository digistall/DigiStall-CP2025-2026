// Login Functions - All business logic and event handlers
import { TouchableOpacity, Text } from 'react-native';
import ApiService from '../../../services/ApiService';
import UserStorageService from '../../../services/UserStorageService';
import { API_CONFIG } from '../../../config/networkConfig';

// Mobile login using credential table with improved backend
export const handleLogin = async (username, password, setIsLoading, navigation, setErrorModal) => {
  console.log('Login pressed', { username, password });

  // Validation
  if (!username || !password) {
    setErrorModal({
      visible: true,
      title: 'Validation Error',
      message: 'Please enter both username and password.',
      type: 'error'
    });
    return;
  }

  // Start loading
  setIsLoading(true);

  try {
    // Enhanced connectivity testing
    console.log('🔌 Testing basic connectivity...');
    console.log('🔗 Target URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.MOBILE_ENDPOINTS.LOGIN}`);
    
    // First, test if we can reach the server at all
    const isConnected = await ApiService.testConnectivity();
    
    if (!isConnected) {
      throw new Error('Cannot reach the server. Please check:\n\n• Backend server is running on port 3001\n• Same Wi-Fi network\n• Windows Firewall allows Node.js\n• IP address is correct (192.168.1.101)');
    }

    console.log('✅ Basic connectivity successful');

    // Test health endpoint
    console.log('📋 Login step 1: Testing basic connectivity...');
    const connectivityResult = await ApiService.testConnectivity();
    
    if (!connectivityResult.success) {
      throw new Error(connectivityResult.message);
    }

    console.log('✅ Connection successful to server:', connectivityResult.server);

    // Now attempt login
    console.log('🔐 Attempting login...');
    const response = await ApiService.mobileLogin(username, password);

    if (response.success) {
      console.log('✅ Login successful:', response.message);

      // Save user data in simple format
      const userData = response.data;
      
      console.log('💾 Saving user data with keys:', Object.keys(userData));
      console.log('👤 User info:', JSON.stringify(userData.user, null, 2));
      console.log('📊 Applications:', JSON.stringify(userData.applications, null, 2));
      console.log('🏪 Stalls:', JSON.stringify(userData.stalls, null, 2));
      
      await UserStorageService.saveUserData(userData);

      // Show success message
      const userName = userData.user?.full_name || userData.user?.username || 'User';
      setErrorModal({
        visible: true,
        title: 'Login Successful',
        message: `Welcome back, ${userName}!`,
        type: 'success'
      });

      // Navigate to StallHome after short delay
      setTimeout(() => {
        if (navigation) {
          navigation.navigate('StallHome');
        }
      }, 1500);

    } else {
      // Login failed
      console.log('❌ Login failed:', response.message);

      setErrorModal({
        visible: true,
        title: 'Login Failed',
        message: response.message || 'Invalid username or password. Please check your credentials and try again.',
        type: 'error'
      });
    }
  } catch (error) {
    console.error('❌ Login error:', error);

    let errorMessage = 'Unable to connect to the server.';
    let errorTitle = 'Connection Error';

    if (error.message.includes('Cannot reach the server')) {
      errorMessage = error.message;
      errorTitle = 'Server Connection Failed';
    } else if (error.message.includes('Network request failed')) {
      errorMessage = 'Network connection failed. Please check:\n\n• Your internet connection\n• Backend server is running on port 3001\n• Same Wi-Fi network\n• Windows Firewall settings\n• IP address: 192.168.1.101';
      errorTitle = 'Network Error';
    } else if (error.message.includes('health check failed')) {
      errorMessage = 'Backend server is not responding properly. Please restart the backend server and try again.';
      errorTitle = 'Backend Error';
    } else {
      errorMessage = error.message || 'An unexpected error occurred. Please try again.';
    }

    setErrorModal({
      visible: true,
      title: errorTitle,
      message: errorMessage,
      type: 'error'
    });
  } finally {
    // Stop loading
    setIsLoading(false);
  }
};export const handleForgotPassword = (setErrorModal) => {
  console.log('Forgot password pressed');
  
  if (setErrorModal) {
    setErrorModal({
      visible: true,
      title: 'Password Recovery',
      message: 'Please contact your system administrator to reset your password or visit the main office for assistance.',
      type: 'info'
    });
  }
};