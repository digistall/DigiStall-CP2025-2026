// ===== FRONTEND-MOBILE/index.js =====
// Aggregator file that exports ALL mobile screens from MVC role folders
// This consolidates all React Native screens for easy import in App.js

// ===== STALL_HOLDER SCREENS =====
import StallHome from '../STALL_HOLDER/FRONTEND-MOBILE/SCREENS/StallHome';
// import TabbedStallScreen from '../STALL_HOLDER/FRONTEND-MOBILE/SCREENS/Stall/TabbedStallScreen';
// import DocumentsScreen from '../STALL_HOLDER/FRONTEND-MOBILE/SCREENS/Documents/DocumentsScreen';
// import RaffleScreen from '../STALL_HOLDER/FRONTEND-MOBILE/SCREENS/Raffle/RaffleScreen';
// import ComplaintScreen from '../STALL_HOLDER/FRONTEND-MOBILE/SCREENS/Report/ComplaintScreen';
// import SettingsScreen from '../STALL_HOLDER/FRONTEND-MOBILE/SCREENS/Settings/SettingsScreen';

// ===== VENDOR SCREENS =====
import VendorHome from '../VENDOR/FRONTEND-MOBILE/SCREENS/VendorHome';

// ===== EMPLOYEE SCREENS =====
import InspectorHome from '../EMPLOYEE/INSPECTOR/FRONTEND-MOBILE/SCREENS/InspectorHome';
import CollectorHome from '../EMPLOYEE/COLLECTOR/FRONTEND-MOBILE/SCREENS/CollectorHome';

// ===== APPLICANT SCREENS =====
// import ApplicantHome from '../APPLICANTS/FRONTEND-MOBILE/SCREENS/ApplicantHome';

// ===== EXPORT ORGANIZED BY ROLE =====
export const StallHolderScreens = {
  Home: StallHome,
  // Stalls: TabbedStallScreen,
  // Documents: DocumentsScreen,
  // Raffle: RaffleScreen,
  // Complaints: ComplaintScreen,
  // Settings: SettingsScreen
};

export const VendorScreens = {
  Home: VendorHome
};

export const EmployeeScreens = {
  Inspector: {
    Home: InspectorHome
  },
  Collector: {
    Home: CollectorHome
  }
};

export const ApplicantScreens = {
  // Home: ApplicantHome
};

// ===== NAVIGATION CONFIGURATION =====
export const navigationScreens = {
  StallHome: { name: 'StallHome', component: StallHome, options: { title: 'Stall Holder Home' } },
  VendorHome: { name: 'VendorHome', component: VendorHome, options: { title: 'Vendor Home' } },
  InspectorHome: { name: 'InspectorHome', component: InspectorHome, options: { title: 'Inspector Home' } },
  CollectorHome: { name: 'CollectorHome', component: CollectorHome, options: { title: 'Collector Home' } }
};

// ===== ROLE-BASED SCREEN GROUPS =====
export const roleScreenGroups = {
  stallHolder: ['StallHome'],
  vendor: ['VendorHome'],
  inspector: ['InspectorHome'],
  collector: ['CollectorHome']
};

// ===== HELPER FUNCTION =====
export function getScreensForRole(role) {
  const roleScreenNames = roleScreenGroups[role] || [];
  return roleScreenNames.map(name => navigationScreens[name]);
}

// ===== EXPORT INDIVIDUAL SCREENS =====
export {
  StallHome,
  VendorHome,
  InspectorHome,
  CollectorHome
};

export default {
  StallHolderScreens,
  VendorScreens,
  EmployeeScreens,
  ApplicantScreens,
  navigationScreens,
  roleScreenGroups,
  getScreensForRole
};
