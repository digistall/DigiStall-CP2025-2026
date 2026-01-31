import React from 'react';
import { View, TextInput, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const SearchBar = ({ searchText, onSearchChange, placeholder = "Search stalls, location, or floor...", theme }) => {
  return (
    <View style={[styles.searchContainer, theme && { backgroundColor: theme.colors.background }]}>
      <Icon name="search" size={20} color={theme ? theme.colors.textTertiary : "#9CA3AF"} style={styles.searchIcon} />
      <TextInput
        style={[styles.searchInput, theme && { color: theme.colors.text }]}
        placeholder={placeholder}
        value={searchText}
        onChangeText={onSearchChange}
        placeholderTextColor={theme ? theme.colors.textTertiary : "#9CA3AF"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginRight: 12,
    height: 45,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
});

export default SearchBar;
