// Login Functions - All business logic and event handlers
import ApiService from '../../../services/ApiService';
import UserStorageService from '../../../services/UserStorageService';
import { API_CONFIG } from '../../../config/networkConfig';

// Mobile login using credential table with improved backend
export const handleLogin = async (
  username, 
  password, 
  setIsLoading, 
  navigation, 
  setErrorModal,
  setLoadingState // New callback for loading state updates
) => {
  console.log('Login pressed', { username, password: '***' });

  // Validation
  if (!username || !password) {
    setErrorModal({
      visible: true,
      title: 'Required Fields',
      message: 'Please enter your username and password to continue.',
      type: 'error'
    });
    return;
  }

  // Start loading
  setIsLoading(true);
  
  // Update loading state if callback provided
  if (setLoadingState) {
    setLoadingState({ step: 'connecting', message: 'Connecting to server...' });
  }

  try {
    // Enhanced connectivity testing
    console.log('🔌 Testing basic connectivity...');
    
    // First, test if we can reach the server at all
    const isConnected = await ApiService.testConnectivity();
    
    if (!isConnected) {
      throw new Error('Cannot reach the server. Please check:\n\n• Backend server is running on port 3001\n• Same Wi-Fi network\n• Windows Firewall allows Node.js');
    }

    console.log('✅ Basic connectivity successful');
    
    if (setLoadingState) {
      setLoadingState({ step: 'authenticating', message: 'Verifying credentials...' });
    }

    // Now attempt login
    console.log('🔐 Attempting login...');
    const response = await ApiService.mobileLogin(username, password);

    if (response.success) {
      console.log('✅ Login successful:', response.message);
      
      if (setLoadingState) {
        setLoadingState({ step: 'loading', message: 'Loading your profile...' });
      }

      // Save user data in simple format
      const userData = response.data;
      
      console.log('💾 Saving user data with keys:', Object.keys(userData));
      console.log('👤 User info:', JSON.stringify(userData.user, null, 2));
      console.log('💑 Spouse info:', JSON.stringify(userData.spouse, null, 2));
      console.log('💼 Business info:', JSON.stringify(userData.business, null, 2));
      console.log('📋 Other info:', JSON.stringify(userData.other_info, null, 2));
      console.log('📄 Application info:', JSON.stringify(userData.application, null, 2));
      console.log('🏪 Stallholder info:', JSON.stringify(userData.stallholder, null, 2));
      console.log('🔑 Is Stallholder:', userData.isStallholder);
      console.log('📝 Application Status:', userData.applicationStatus);
      
      await UserStorageService.saveUserData(userData);
      
      // Save JWT token if provided
      if (response.token) {
        await UserStorageService.saveAuthToken(response.token);
        console.log('🔐 Auth token saved for persistent login');
      }

      // Stop the initial loading
      setIsLoading(false);

      // Get user info for loading screen
      const userName = userData.user?.full_name || userData.user?.username || 'User';
      const isStallholder = userData.isStallholder;
      const stallNo = userData.stallholder?.stall_no;

      // Navigate to loading screen instead of directly to StallHome
      if (navigation) {
        navigation.navigate('LoadingScreen', {
          userName,
          isStallholder,
          stallNo,
          nextScreen: 'StallHome',
          loadingDuration: 3000
        });
      }

    } else {
      // Login failed - show professional error message
      console.log('❌ Login failed:', response.message);
      setIsLoading(false);

      setErrorModal({
        visible: true,
        title: 'Authentication Failed',
        message: response.message || 'The credentials you entered are incorrect. Please verify your username and password.',
        type: 'error'
      });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    setIsLoading(false);

    let errorMessage = 'Unable to connect to the server.';
    let errorTitle = 'Connection Error';

    if (error.message.includes('Cannot reach the server')) {
      errorMessage = error.message;
      errorTitle = 'Server Unavailable';
    } else if (error.message.includes('Network request failed')) {
      errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      errorTitle = 'Network Error';
    } else if (error.message.includes('health check failed')) {
      errorMessage = 'The server is not responding. Please try again later.';
      errorTitle = 'Server Error';
    } else {
      errorMessage = error.message || 'An unexpected error occurred. Please try again.';
    }

    setErrorModal({
      visible: true,
      title: errorTitle,
      message: errorMessage,
      type: 'error'
    });
  }
};

export const handleForgotPassword = (setErrorModal) => {
  console.log('Forgot password pressed');
  
  if (setErrorModal) {
    setErrorModal({
      visible: true,
      title: 'Password Recovery',
      message: 'To reset your password, please contact your administrator or visit the Naga City Public Market management office with a valid ID.',
      type: 'info'
    });
  }
};