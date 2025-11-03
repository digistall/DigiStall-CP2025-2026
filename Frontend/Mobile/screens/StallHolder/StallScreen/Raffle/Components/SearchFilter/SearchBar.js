import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SearchBar = ({ 
  searchValue = '', 
  onSearch,
  placeholder = "Search by stall number or location..."
}) => {
  return (
    <View style={styles.searchContainer}>
      <Icon name="search" size={22} color="#64748b" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={searchValue}
        onChangeText={onSearch}
        placeholderTextColor="#94a3b8"
      />
      {searchValue.length > 0 && (
        <TouchableOpacity
          onPress={() => onSearch('')}
          style={styles.clearSearchButton}
        >
          <Icon name="clear" size={20} color="#64748b" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '400',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default SearchBar;