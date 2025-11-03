import React from 'react';
import { View, StyleSheet } from 'react-native';
import SearchBar from './SearchBar';
import FilterButton from './FilterButton';

const SearchFilterBar = ({ 
  onSearch, 
  onFilter, 
  searchValue = '', 
  selectedFilters = [] 
}) => {
  return (
    <View style={styles.container}>
      <SearchBar 
        searchValue={searchValue}
        onSearch={onSearch}
        placeholder="Search by stall number or location..."
      />
      <FilterButton 
        selectedFilters={selectedFilters}
        onFilter={onFilter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});

// Add this missing export
export default SearchFilterBar;