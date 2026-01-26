import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#374151',
    primary: '#f59e0b', // Inspector accent color (amber)
  }
};

const Header = ({ onMenuPress, title = "Inspector", theme = defaultTheme, isDarkMode = false }) => {
  const colors = theme?.colors || defaultTheme.colors;
  
  return (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={onMenuPress}
      >
        <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>☰</Text>
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Inspector</Text>
        </View>
      </View>
      
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 60,
  },
  menuButton: {
    padding: width * 0.02,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: width * 0.06,
    minHeight: 24,
    fontWeight: '300',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: width * 0.045,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeContainer: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
});

export default Header;
