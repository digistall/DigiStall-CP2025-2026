import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SearchBar from './SearchBar';
import FilterButton from './FilterButton';
import { useTheme } from '../../../../../../components/ThemeComponents/ThemeContext';

const { width } = Dimensions.get('window');

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    border: '#e5e7eb',
  }
};

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
  ],
  theme: propTheme,
  isDark: propIsDark,
}) => {
  const contextTheme = useTheme();
  const theme = propTheme || contextTheme?.theme || defaultTheme;
  const isDark = propIsDark !== undefined ? propIsDark : contextTheme?.isDark || false;
  const colors = theme?.colors || defaultTheme.colors;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <SearchBar 
        searchText={searchText}
        onSearchChange={onSearchChange}
        placeholder={searchPlaceholder}
        theme={theme}
        isDark={isDark}
      />
      
      <FilterButton
        selectedFilter={selectedFilter}
        onFilterSelect={onFilterSelect}
        selectedSort={selectedSort}
        onSortSelect={onSortSelect}
        filters={filters}
        sortOptions={sortOptions}
        theme={theme}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.04,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
});

export default SearchFilterBar;
