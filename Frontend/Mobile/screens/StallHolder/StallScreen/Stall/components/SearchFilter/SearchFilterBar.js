import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SearchBar from './SearchBar';
import FilterButton from './FilterButton';

const { width } = Dimensions.get('window');

const SearchFilterBar = ({ 
  searchText, 
  onSearchChange, 
  selectedFilter, 
  onFilterSelect, 
  selectedSort, 
  onSortSelect,
  searchPlaceholder = "Search stalls, location, or floor...",
  filters = ['ALL', 'NCPM', 'SATELLITE MARKET'],
  sortOptions = [
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Default', value: 'default' }
  ]
}) => {
  return (
    <View style={styles.container}>
      <SearchBar 
        searchText={searchText}
        onSearchChange={onSearchChange}
        placeholder={searchPlaceholder}
      />
      
      <FilterButton
        selectedFilter={selectedFilter}
        onFilterSelect={onFilterSelect}
        selectedSort={selectedSort}
        onSortSelect={onSortSelect}
        filters={filters}
        sortOptions={sortOptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.04,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
});

export default SearchFilterBar;