import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const DocumentStatus = () => {
  const documents = [
    { name: 'Business Permit', status: 'Complete', lastUpdated: '2024-01-15' },
    { name: 'Fire Safety Certificate', status: 'Complete', lastUpdated: '2024-01-20' },
    { name: 'Health Certificate', status: 'Pending', lastUpdated: '2024-03-01' },
    { name: 'Tax Clearance', status: 'Incomplete', lastUpdated: '2024-02-15' },
    { name: 'Contract Agreement', status: 'Complete', lastUpdated: '2024-01-01' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Complete': return '#10b981';
      case 'Pending': return '#f59e0b';
      case 'Incomplete': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Complete': return '✓';
      case 'Pending': return '⏳';
      case 'Incomplete': return '✗';
      default: return '?';
    }
  };

  const completedCount = documents.filter(doc => doc.status === 'Complete').length;
  const completionRate = Math.round((completedCount / documents.length) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.header}>Document Status</Text>
        <Text style={styles.completion}>
          {completedCount}/{documents.length} Complete ({completionRate}%)
        </Text>
      </View>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
      </View>

      {documents.map((document, index) => (
        <View key={index} style={styles.documentItem}>
          <View style={styles.documentInfo}>
            <View style={styles.documentHeader}>
              <Text style={styles.documentName}>{document.name}</Text>
              <View style={styles.statusContainer}>
                <Text style={styles.statusIcon}>{getStatusIcon(document.status)}</Text>
                <Text style={[styles.status, { color: getStatusColor(document.status) }]}>
                  {document.status}
                </Text>
              </View>
            </View>
            <Text style={styles.lastUpdated}>Last updated: {document.lastUpdated}</Text>
          </View>
        </View>
      ))}
      
      <TouchableOpacity style={styles.manageButton}>
        <Text style={styles.buttonText}>Manage Documents</Text>
      </TouchableOpacity>
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
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width * 0.03,
  },
  header: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  completion: {
    fontSize: width * 0.03,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: width * 0.04,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  documentItem: {
    paddingVertical: width * 0.025,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  documentInfo: {
    flex: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width * 0.01,
  },
  documentName: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: width * 0.03,
    marginRight: width * 0.01,
  },
  status: {
    fontSize: width * 0.03,
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: width * 0.03,
    color: '#6b7280',
  },
  manageButton: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: width * 0.025,
    alignItems: 'center',
    marginTop: width * 0.03,
  },
  buttonText: {
    color: 'white',
    fontSize: width * 0.035,
    fontWeight: '600',
  },
});

export default DocumentStatus;