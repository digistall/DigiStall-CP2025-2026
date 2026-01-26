import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const StallInfo = () => {
  const stallData = {
    stallNumber: 'A-45',
    type: 'NCPM',
    location: 'Main Building - Ground Floor',
    size: '3m x 2m',
    monthlyRent: '₱2,500',
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stall Information</Text>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Stall Number</Text>
          <Text style={styles.value}>{stallData.stallNumber}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{stallData.type}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{stallData.location}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Size</Text>
          <Text style={styles.value}>{stallData.size}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Monthly Rent</Text>
          <Text style={styles.value}>{stallData.monthlyRent}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>Contract Period</Text>
          <Text style={styles.value}>
            {stallData.contractStart} - {stallData.contractEnd}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: width * 0.04,
    marginBottom: width * 0.04,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: width * 0.03,
  },
  infoGrid: {
    gap: width * 0.025,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: width * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: width * 0.035,
    color: '#6b7280',
    fontWeight: '500',
  },
  value: {
    fontSize: width * 0.035,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: width * 0.04,
  },
});

export default StallInfo;