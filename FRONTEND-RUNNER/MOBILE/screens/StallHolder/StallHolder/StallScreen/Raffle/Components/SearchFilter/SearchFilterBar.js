import React from 'react';
import { View, StyleSheet } from 'react-native';
import SearchBar from './SearchBar';
import FilterButton from './FilterButton';
import { useTheme } from '../../../../../../../components/ThemeComponents/ThemeContext';

const SearchFilterBar = ({ 
  onSearch, 
  onFilter, 
  searchValue = '', 
  selectedFilters = [] 
}) => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.border
      }
    ]}>
      <SearchBar 
        searchValue={searchValue}
        onSearch={onSearch}
        placeholder="Search by stall number or location..."
        theme={theme}
        isDark={isDark}
      />
      <FilterButton 
        selectedFilters={selectedFilters}
        onFilter={onFilter}
        theme={theme}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
