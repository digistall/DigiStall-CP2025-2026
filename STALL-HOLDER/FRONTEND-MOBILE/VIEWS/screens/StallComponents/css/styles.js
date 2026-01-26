import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.85,
    maxWidth: 320,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 4,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'column', // Added for proper flex layout
  },
  content: {
    flex: 1,
    flexDirection: 'column', // Added for proper flex layout
  },
  headerGradient: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profileSection: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInitials: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
  },
  profileStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addAccountButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  plusIcon: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '300',
  },
  navigationSection: {
    paddingTop: 32,
    paddingHorizontal: 8,
    flex: 1, // Added to take up available space
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 12,
    position: 'relative',
    marginBottom: 4,
  },
  activeMenuItem: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeIndicator: {
    position: 'absolute',
    right: 8,
    width: 4,
    height: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  menuIconContainer: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemIconImage: {
    width: 24,
    height: 24,
    tintColor: '#64748b',
  },
  menuItemText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '500',
    letterSpacing: 0.2,
    flex: 1,
  },
  activeMenuItemText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  bottomSection: {
    // Removed marginTop: 'auto' since it's now positioned at the bottom
    paddingTop: 20, // Added some top padding
    paddingBottom: 32,
    backgroundColor: '#ffffff', // Ensure background matches
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  logoutIconContainer: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  versionContainer: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },

  // Custom icon styles
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Settings Icon
  settingsIcon: {
    width: 22,
    height: 22,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#64748b',
  },
  settingsTooth: {
    position: 'absolute',
    width: 4,
    height: 6,
    backgroundColor: '#64748b',
  },

  // Logout Icon
  logoutIcon: {
    width: 22,
    height: 18,
    position: 'relative',
  },
  logoutArrow: {
    position: 'absolute',
    top: 7,
    left: 0,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#ef4444',
  },
  logoutDoor: {
    position: 'absolute',
    top: 3,
    right: 0,
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    borderLeftWidth: 0,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});