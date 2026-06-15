import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles as baseStyles } from './css/styles';
import UserStorageService from '../../services/UserStorageService';
import { getSafeDisplayValue, getUserInitials } from '../../services/DataDisplayUtils';

const { width } = Dimensions.get('window');

const defaultTheme = {
  colors: {
    surface: '#ffffff',
    background: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    primary: '#1d4ed8',
    card: '#ffffff',
  },
};

const Sidebar = ({
  isVisible,
  onClose,
  onProfilePress,
  onMenuItemPress,
  activeMenuItem = 'dashboard',
  theme = defaultTheme,
  isDarkMode = false,
}) => {
  const colors = theme?.colors || defaultTheme.colors;
  const slideAnim = useRef(new Animated.Value(-width * 0.85)).current;
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await UserStorageService.getUserData();
        if (storedUserData) {
          setUserData(storedUserData);
        }
      } catch (error) {
        console.error('Error loading vendor user data for sidebar:', error);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width * 0.85,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const getVendorName = () => {
    if (!userData) return null;
    const vendor = userData.vendor;
    if (vendor?.full_name) return vendor.full_name;
    if (vendor?.first_name && vendor?.last_name) {
      return `${vendor.first_name} ${vendor.last_name}`.trim();
    }
    return 'Vendor';
  };

  const getVendorContact = () => {
    if (!userData) return '';
    return userData.vendor?.email || userData.vendor?.contact_number || '';
  };

  const getDisplayInitials = (fullName) => {
    if (!fullName) return 'V';
    return getUserInitials(fullName, 'V');
  };

  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: 'grid' },
    { id: 'payments', title: 'My Payments', icon: 'receipt' },
    { id: 'myqrcode', title: 'My QR Code', icon: 'qr-code' },
    { id: 'documents', title: 'My Documents', icon: 'document-text' },
    { id: 'profile', title: 'My Profile', icon: 'person' },
    { id: 'business', title: 'Business Info', icon: 'briefcase' },
    { id: 'settings', title: 'Settings', icon: 'settings' },
  ];

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={baseStyles.container}>
        <TouchableOpacity
          style={baseStyles.overlay}
          onPress={onClose}
          activeOpacity={1}
        />

        <Animated.View
          style={[
            baseStyles.sidebar,
            { backgroundColor: colors.surface, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <ScrollView
            style={baseStyles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Header / Profile */}
            <View
              style={[
                baseStyles.headerGradient,
                { backgroundColor: colors.background, borderBottomColor: colors.border },
              ]}
            >
              <View style={baseStyles.profileSection}>
                <TouchableOpacity
                  style={baseStyles.profileContainer}
                  onPress={onProfilePress}
                >
                  <View style={baseStyles.profileImageContainer}>
                    <View style={[baseStyles.profileImage, { backgroundColor: '#1d4ed8' }]}>
                      <Text style={baseStyles.profileInitials}>
                        {userData ? getDisplayInitials(getVendorName()) : 'V'}
                      </Text>
                    </View>
                    <View style={baseStyles.statusIndicator} />
                  </View>
                  <View style={baseStyles.profileInfo}>
                    <Text style={[baseStyles.profileName, { color: colors.text }]}>
                      {userData ? getVendorName() || 'Loading...' : 'Loading...'}
                    </Text>
                    <Text style={[baseStyles.profileEmail, { color: colors.textSecondary }]}>
                      {userData ? getVendorContact() : ''}
                    </Text>
                    <View style={localStyles.roleContainer}>
                      <Text style={baseStyles.profileStatus}>Online</Text>
                      <Text style={baseStyles.profileRole}>• Vendor</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Navigation Items */}
            <View style={baseStyles.navigationSection}>
              <Text style={[baseStyles.sectionTitle, { color: colors.textSecondary }]}>
                NAVIGATION
              </Text>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    baseStyles.menuItem,
                    activeMenuItem === item.id && [
                      baseStyles.activeMenuItem,
                      {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#dbeafe',
                        borderColor: '#1d4ed8',
                      },
                    ],
                  ]}
                  onPress={() => onMenuItemPress(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={baseStyles.menuIconContainer}>
                    <Ionicons
                      name={activeMenuItem === item.id ? item.icon : `${item.icon}-outline`}
                      size={24}
                      color={activeMenuItem === item.id ? '#1d4ed8' : colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      baseStyles.menuItemText,
                      { color: colors.textSecondary },
                      activeMenuItem === item.id && [
                        baseStyles.activeMenuItemText,
                        { color: colors.text },
                      ],
                    ]}
                  >
                    {item.title}
                  </Text>
                  {activeMenuItem === item.id && (
                    <View style={[baseStyles.activeIndicator, { backgroundColor: '#1d4ed8' }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Fixed Bottom Section */}
          <View style={[baseStyles.bottomSection, { backgroundColor: colors.surface }]}>
            <View style={[baseStyles.divider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={baseStyles.logoutItem}
              onPress={() => onMenuItemPress('logout')}
              activeOpacity={0.7}
            >
              <View style={baseStyles.logoutIconContainer}>
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              </View>
              <Text style={baseStyles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={baseStyles.versionContainer}>
              <Text style={[baseStyles.versionText, { color: colors.textSecondary }]}>
                Version 1.0.0
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});

export default Sidebar;
