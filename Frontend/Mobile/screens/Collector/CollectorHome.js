import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import UserStorageService from '../../services/UserStorageService';
import ApiService from '../../services/ApiService';

const { width } = Dimensions.get('window');

const CollectorHome = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await UserStorageService.getUserData();
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    // Prevent multiple clicks
    if (isLoggingOut) {
      console.log('⏳ Logout already in progress, ignoring...');
      return;
    }
    
    setIsLoggingOut(true);
    
    try {
      // Get user data before clearing
      const userData = await UserStorageService.getUserData();
      const token = userData?.token;
      const staffId = userData?.staff?.collector_id || userData?.staff?.staffId;
      const staffType = 'collector';
      
      // Call staff logout API to update last_logout in database
      if (token && staffId) {
        await ApiService.staffLogout(token, staffId, staffType);
        console.log('✅ Staff logout API called - last_logout updated');
      }
      
      // Clear local storage
      await UserStorageService.clearUserData();
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigateToScreen = (screen) => {
    setActiveScreen(screen);
    setSidebarVisible(false);
  };

  const renderSidebar = () => (
    <Modal
      visible={sidebarVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSidebarVisible(false)}
    >
      <View style={styles.sidebarOverlay}>
        <View style={styles.sidebar}>
          {/* Profile Section */}
          <View style={styles.sidebarHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={80} color="#4A90D9" />
            </View>
            <Text style={styles.sidebarName}>
              {userData?.staff?.first_name} {userData?.staff?.last_name}
            </Text>
            <Text style={styles.sidebarRole}>Collector</Text>
            <Text style={styles.sidebarBranch}>{userData?.staff?.branch_name}</Text>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.sidebarMenu}>
            <TouchableOpacity 
              style={[styles.menuItem, activeScreen === 'home' && styles.menuItemActive]}
              onPress={() => navigateToScreen('home')}
            >
              <Ionicons name="home-outline" size={24} color={activeScreen === 'home' ? '#4A90D9' : '#666'} />
              <Text style={[styles.menuItemText, activeScreen === 'home' && styles.menuItemTextActive]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, activeScreen === 'profile' && styles.menuItemActive]}
              onPress={() => navigateToScreen('profile')}
            >
              <Ionicons name="person-outline" size={24} color={activeScreen === 'profile' ? '#4A90D9' : '#666'} />
              <Text style={[styles.menuItemText, activeScreen === 'profile' && styles.menuItemTextActive]}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, activeScreen === 'settings' && styles.menuItemActive]}
              onPress={() => navigateToScreen('settings')}
            >
              <Ionicons name="settings-outline" size={24} color={activeScreen === 'settings' ? '#4A90D9' : '#666'} />
              <Text style={[styles.menuItemText, activeScreen === 'settings' && styles.menuItemTextActive]}>Settings</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutMenuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#dc3545" />
            <Text style={styles.logoutMenuText}>Logout</Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeSidebar}
            onPress={() => setSidebarVisible(false)}
          >
            <Ionicons name="close" size={30} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderHomeContent = () => (
    <View style={styles.content}>
      <View style={styles.welcomeCard}>
        <Ionicons name="cash-outline" size={60} color="#4A90D9" />
        <Text style={styles.welcomeTitle}>Welcome, Collector!</Text>
        <Text style={styles.welcomeSubtitle}>
          {userData?.staff?.first_name} {userData?.staff?.last_name}
        </Text>
        <Text style={styles.branchText}>{userData?.staff?.branch_name}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Collector Dashboard</Text>
        <Text style={styles.infoText}>
          This is your collector dashboard. Features will be added soon.
        </Text>
      </View>
    </View>
  );

  const renderProfileContent = () => (
    <View style={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Ionicons name="person-circle" size={100} color="#4A90D9" />
          <Text style={styles.profileName}>
            {userData?.staff?.first_name} {userData?.staff?.last_name}
          </Text>
          <Text style={styles.profileRole}>Collector</Text>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.profileRow}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Email:</Text>
            <Text style={styles.profileValue}>{userData?.staff?.email || 'N/A'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Phone:</Text>
            <Text style={styles.profileValue}>{userData?.staff?.contact_no || 'N/A'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Ionicons name="business-outline" size={20} color="#666" />
            <Text style={styles.profileLabel}>Branch:</Text>
            <Text style={styles.profileValue}>{userData?.staff?.branch_name || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSettingsContent = () => (
    <View style={styles.content}>
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="notifications-outline" size={24} color="#666" />
          <Text style={styles.settingsItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="lock-closed-outline" size={24} color="#666" />
          <Text style={styles.settingsItemText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="help-circle-outline" size={24} color="#666" />
          <Text style={styles.settingsItemText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="information-circle-outline" size={24} color="#666" />
          <Text style={styles.settingsItemText}>About</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeScreen) {
      case 'profile':
        return renderProfileContent();
      case 'settings':
        return renderSettingsContent();
      default:
        return renderHomeContent();
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)}>
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {activeScreen === 'home' ? 'Collector Home' : 
             activeScreen === 'profile' ? 'My Profile' : 'Settings'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Main Content */}
        <ScrollView style={styles.scrollContent}>
          {renderContent()}
        </ScrollView>

        {/* Sidebar */}
        {renderSidebar()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  branchText: {
    fontSize: 14,
    color: '#4A90D9',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Sidebar Styles
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    width: width * 0.75,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  sidebarHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  sidebarName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sidebarRole: {
    fontSize: 14,
    color: '#4A90D9',
    marginTop: 4,
  },
  sidebarBranch: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuItemActive: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 3,
    borderLeftColor: '#4A90D9',
  },
  menuItemText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
  },
  menuItemTextActive: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  logoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  logoutMenuText: {
    fontSize: 16,
    color: '#dc3545',
    marginLeft: 15,
    fontWeight: '600',
  },
  closeSidebar: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  // Profile Styles
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  profileRole: {
    fontSize: 16,
    color: '#4A90D9',
    marginTop: 4,
  },
  profileInfo: {
    paddingTop: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    width: 60,
  },
  profileValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  // Settings Styles
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
});

export default CollectorHome;
