import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  Modal, 
  FlatList, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const FilterButton = ({ 
  selectedFilter, 
  onFilterSelect, 
  selectedSort, 
  onSortSelect,
  filters = ['ALL', 'NCPM', 'SATELLITE MARKET'],
  sortOptions = [
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Default', value: 'default' }
  ]
}) => {
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const toggleFilterDropdown = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  const handleFilterSelect = (filter) => {
    onFilterSelect(filter);
    setIsFilterVisible(false);
  };

  const handleSortSelect = (sortValue) => {
    onSortSelect(sortValue);
    setIsFilterVisible(false);
  };

  const hasActiveFilters = selectedFilter !== 'ALL' || selectedSort !== 'default';

  const renderFilterSection = ({ item: section }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.dropdownItem,
            option.isSelected && styles.activeDropdownItem
          ]}
          onPress={option.onPress}
        >
          <Text style={[
            styles.dropdownItemText,
            option.isSelected && styles.activeDropdownItemText
          ]}>
            {option.label}
          </Text>
          {option.isSelected && (
            <Icon name="check" size={16} color="#002181" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const filterSections = [
    {
      id: 'category',
      title: 'Category',
      options: filters.map(filter => ({
        key: filter,
        label: filter,
        isSelected: selectedFilter === filter,
        onPress: () => handleFilterSelect(filter)
      }))
    },
    {
      id: 'sort',
      title: 'Sort by Price',
      options: sortOptions.map(option => ({
        key: option.value,
        label: option.label,
        isSelected: selectedSort === option.value,
        onPress: () => handleSortSelect(option.value)
      }))
    }
  ];

  return (
    <>
      {/* Filter Button */}
      <TouchableOpacity
        style={[
          styles.filterButton,
          hasActiveFilters && styles.filterButtonActive
        ]}
        onPress={toggleFilterDropdown}
      >
        <Icon 
          name="filter-list" 
          size={20} 
          color={hasActiveFilters ? "#002181" : "#6b7280"} 
        />
        {hasActiveFilters && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeDot}>
              {(selectedFilter !== 'ALL' ? 1 : 0) + (selectedSort !== 'default' ? 1 : 0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={isFilterVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity 
                onPress={() => setIsFilterVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={filterSections}
              keyExtractor={(item) => item.id}
              renderItem={renderFilterSection}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              showsVerticalScrollIndicator={false}
              style={styles.filterList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    backgroundColor: '#ffffffff',
    borderRadius: 25,
    padding: 12,
    position: 'relative',
    minWidth: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeDot: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 140,
    paddingRight: width * 0.04,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: width * 0.65,
    maxWidth: width * 0.85,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.84,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionContainer: {
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002181',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  activeDropdownItem: {
    backgroundColor: 'rgba(0, 33, 129, 0.1)',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  activeDropdownItemText: {
    color: '#002181',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
});

export default FilterButton;