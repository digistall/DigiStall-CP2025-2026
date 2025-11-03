import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const FilterButton = ({ 
  selectedFilters = [],
  onFilter 
}) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState(selectedFilters);

  const filterOptions = [
    { 
      id: 'ongoing', 
      label: 'Raffle Ongoing', 
      color: '#10b981',
      icon: 'play-circle-outline',
      description: 'Active raffles you can join'
    },
    { 
      id: 'countdown', 
      label: 'Countdown', 
      color: '#f59e0b',
      icon: 'schedule',
      description: 'Raffles starting soon'
    },
    { 
      id: 'expired', 
      label: 'Expired', 
      color: '#6b7280',
      icon: 'block',
      description: 'Completed raffles'
    },
  ];

  const handleFilterToggle = (filterId) => {
    setTempFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const applyFilters = () => {
    onFilter(tempFilters);
    setShowFilterModal(false);
  };

  const clearAllFilters = () => {
    setTempFilters([]);
  };

  const resetTempFilters = () => {
    setTempFilters(selectedFilters);
  };

  const openModal = () => {
    resetTempFilters();
    setShowFilterModal(true);
  };

  const hasActiveFilters = selectedFilters.length > 0;

  const renderFilterOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        tempFilters.includes(item.id) && styles.activeDropdownItem
      ]}
      onPress={() => handleFilterToggle(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.filterOptionContent}>
        <Text style={[
          styles.dropdownItemText,
          tempFilters.includes(item.id) && styles.activeDropdownItemText
        ]}>
          {item.label}
        </Text>
        <Text style={styles.filterDescription}>
          {item.description}
        </Text>
      </View>
      {tempFilters.includes(item.id) && (
        <Icon name="check" size={16} color="#002181" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.filterButton,
          hasActiveFilters && styles.filterButtonActive
        ]}
        onPress={openModal}
      >
        <Icon 
          name="filter-list" 
          size={20} 
          color={hasActiveFilters ? "#002181" : "#6b7280"} 
        />
        {hasActiveFilters && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeDot}>{selectedFilters.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Raffles</Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Raffle Status</Text>
              <FlatList
                data={filterOptions}
                keyExtractor={(item) => item.id}
                renderItem={renderFilterOption}
                showsVerticalScrollIndicator={false}
                style={styles.filterList}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearAllFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.applyButton,
                  tempFilters.length === 0 && styles.applyButtonDisabled
                ]}
                onPress={applyFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.applyButtonText}>
                  Apply{tempFilters.length > 0 ? ` (${tempFilters.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    backgroundColor: '#ffffff',
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
    minWidth: width * 0.75,
    maxWidth: width * 0.9,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
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
  sectionContainer: {
    paddingHorizontal: 16,
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
  filterList: {
    maxHeight: 250,
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
  filterOptionContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 2,
  },
  activeDropdownItemText: {
    color: '#002181',
    fontWeight: '600',
  },
  filterDescription: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#002181',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default FilterButton;