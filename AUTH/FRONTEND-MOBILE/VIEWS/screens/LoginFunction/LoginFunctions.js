// Login Functions - All business logic and event handlers
// ===== REAL-TIME PROGRESS TRACKING ENABLED =====
// This login function now reports actual authentication progress via setLoadingState callback:
// Step 0 (0%): Connecting to server
// Step 1 (20%): Verifying credentials (during API call)
// Step 2 (60%): Loading profile data (after successful auth)
// Step 3 (80%): Preparing dashboard (saving data)
// Step 4 (100%): Finalizing (before navigation)
import ApiService from '@auth-mobile/services/ApiService';
import UserStorageService from '@auth-mobile/services/UserStorageService';
import { API_CONFIG } from '@shared-mobile/config/networkConfig';
import { getSafeUserName, getSafeStaffName } from '@auth-mobile/services/DataDisplayUtils';

// Unified Mobile login - automatically detects staff or regular user
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
    setLoadingState({ step: 0, message: 'Connecting to server...', progress: 0 });
  }

  try {
    // Enhanced connectivity testing
    console.log('🔌 Testing basic connectivity...');
    
    // First, test if we can reach the server at all
    const connectivityResult = await ApiService.testConnectivity();
    
    if (!connectivityResult.success) {
      throw new Error('Cannot reach the server. Please check:\n\n• Backend server is running (port 3001 or 5000)\n• Internet or Wi-Fi connection active\n• DigitalOcean: http://68.183.154.125:5000');
    }

    console.log('✅ Basic connectivity successful to:', connectivityResult.server);
    
    if (setLoadingState) {
      setLoadingState({ step: 1, message: 'Verifying credentials...', progress: 20 });
    }

    // Try staff login first (inspector/collector) - silent fail for non-staff users
    console.log('🔐 Checking if user is staff (inspector/collector)...');
    const staffResponse = await ApiService.mobileStaffLogin(username, password);

    if (staffResponse.success) {
      // Staff login successful - navigate to appropriate screen
      console.log('✅ Staff login successful:', staffResponse.message);
      console.log('👤 Staff type:', staffResponse.staffType);
      
      if (setLoadingState) {
        setLoadingState({ step: 2, message: 'Loading your profile...', progress: 60 });
      }

      // Save staff data
      const staffData = {
        staff: staffResponse.user,
        token: staffResponse.token,
        staffType: staffResponse.staffType
      };
      
      await UserStorageService.saveUserData(staffData);
      
      // Save JWT token
      if (staffResponse.token) {
        await UserStorageService.saveAuthToken(staffResponse.token);
        console.log('🔐 Staff auth token saved');
      }
      
      if (setLoadingState) {
        setLoadingState({ step: 4, message: 'Almost ready...', progress: 100 });
      }

      setIsLoading(false);

      // Navigate based on staff type
      const staffType = staffResponse.staffType || staffResponse.user?.staffType;
      const staffName = getSafeStaffName({ staff: staffResponse.user }, 'Staff');
      
      if (navigation) {
        if (staffType === 'inspector') {
          navigation.navigate('LoadingScreen', {
            userName: staffName,
            isStallholder: false,
            stallNo: null,
            nextScreen: 'InspectorHome',
            loadingDuration: 2000
          });
        } else if (staffType === 'collector') {
          navigation.navigate('LoadingScreen', {
            userName: staffName,
            isStallholder: false,
            stallNo: null,
            nextScreen: 'CollectorHome',
            loadingDuration: 2000
          });
        }
      }
      return; // Exit after successful staff login
    }

    // Staff login failed, try regular user login (this is expected for stallholders)
    console.log('ℹ️ Not a staff user, trying stallholder login...');
    const response = await ApiService.mobileLogin(username, password);

    if (response.success) {
      console.log('✅ Login successful:', response.message);
      
      if (setLoadingState) {
        setLoadingState({ step: 2, message: 'Loading your profile...', progress: 60 });
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
      console.log('🔍 DEBUG - response.token value:', response.token ? 'EXISTS' : 'UNDEFINED/NULL');
      if (response.token) {
        await UserStorageService.saveAuthToken(response.token);
        console.log('🔐 Auth token saved for persistent login');
        console.log('🔐 Token preview:', response.token.substring(0, 30) + '...');
      } else {
        console.log('⚠️ WARNING: No token received from backend! Token is:', response.token);
      }
      
      if (setLoadingState) {
        setLoadingState({ step: 4, message: 'Almost ready...', progress: 100 });
      }

      // Stop the initial loading
      setIsLoading(false);

      // Get user info for loading screen using safe utilities
      const userName = getSafeUserName(userData.user, 'User');
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

export const handleForgotPassword = (arg1, arg2) => {
  // Backwards-compatible handler.
  // If called with navigation first: handleForgotPassword(navigation, setErrorModal?)
  // Otherwise: handleForgotPassword(setErrorModal)
  console.log('Forgot password pressed');

  let navigation = null;
  let setErrorModal = null;

  if (arg1 && typeof arg1 === 'object' && typeof arg1.navigate === 'function') {
    navigation = arg1;
    setErrorModal = arg2;
  } else {
    setErrorModal = arg1;
  }

  try {
    if (navigation) {
      navigation.navigate('ForgotPasswordScreen');
      return;
    }
  } catch (navErr) {
    console.error('Navigation error:', navErr);
  }

  // Fallback: show informational modal when navigation isn't available
  if (setErrorModal) {
    setErrorModal({
      visible: true,
      title: 'Password Recovery',
      message: 'To reset your password, please contact your administrator or visit the Naga City Public Market management office with a valid ID.',
      type: 'info'
    });
  }
};

// Staff login (Inspector/Collector)
export const handleStaffLogin = async (
  username, 
  password, 
  setIsLoading, 
  navigation, 
  setErrorModal,
  setLoadingState
) => {
  console.log('Staff login pressed', { username, password: '***' });

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
  
  if (setLoadingState) {
    setLoadingState({ step: 'connecting', message: 'Connecting to server...' });
  }

  try {
    // Test connectivity
    console.log('🔌 Testing connectivity...');
    const isConnected = await ApiService.testConnectivity();
    
    if (!isConnected) {
      throw new Error('Cannot reach the server. Please check your network connection.');
    }

    console.log('✅ Connectivity successful');
    
    if (setLoadingState) {
      setLoadingState({ step: 'authenticating', message: 'Verifying staff credentials...' });
    }

    // Attempt staff login
    console.log('🔐 Attempting staff login...');
    const response = await ApiService.mobileStaffLogin(username, password);

    if (response.success) {
      console.log('✅ Staff login successful:', response.message);
      console.log('👤 Staff type:', response.staffType);
      
      if (setLoadingState) {
        setLoadingState({ step: 'loading', message: 'Loading your profile...' });
      }

      // Save staff data
      const staffData = {
        staff: response.user,
        token: response.token,
        staffType: response.staffType
      };
      
      await UserStorageService.saveUserData(staffData);
      
      // Save JWT token
      if (response.token) {
        await UserStorageService.saveAuthToken(response.token);
        console.log('🔐 Staff auth token saved');
      }

      setIsLoading(false);

      // Navigate based on staff type using safe utilities
      const staffType = response.staffType || response.user?.staffType;
      const staffName = getSafeStaffName({ staff: response.user }, 'Staff');
      
      if (navigation) {
        if (staffType === 'inspector') {
          navigation.navigate('LoadingScreen', {
            userName: staffName,
            isStallholder: false,
            stallNo: null,
            nextScreen: 'InspectorHome',
            loadingDuration: 2000
          });
        } else if (staffType === 'collector') {
          navigation.navigate('LoadingScreen', {
            userName: staffName,
            isStallholder: false,
            stallNo: null,
            nextScreen: 'CollectorHome',
            loadingDuration: 2000
          });
        } else {
          // Default fallback
          setErrorModal({
            visible: true,
            title: 'Unknown Staff Type',
            message: `Staff type "${staffType}" is not recognized.`,
            type: 'error'
          });
        }
      }

    } else {
      console.log('❌ Staff login failed:', response.message);
      setIsLoading(false);

      setErrorModal({
        visible: true,
        title: 'Authentication Failed',
        message: response.message || 'Invalid staff credentials. Please check your username and password.',
        type: 'error'
      });
    }
  } catch (error) {
    console.error('❌ Staff login error:', error);
    setIsLoading(false);

    setErrorModal({
      visible: true,
      title: 'Login Error',
      message: error.message || 'An error occurred during login. Please try again.',
      type: 'error'
    });
  }
};