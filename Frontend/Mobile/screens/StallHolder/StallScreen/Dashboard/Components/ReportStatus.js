import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const ReportStatus = () => {
  const reports = [
    {
      id: 'RPT-001',
      type: 'Complaint',
      subject: 'Noise Complaint',
      status: 'Under Review',
      date: '2024-03-10',
      priority: 'Medium',
    },
    {
      id: 'RPT-002',
      type: 'Maintenance',
      subject: 'Water Leak',
      status: 'Resolved',
      date: '2024-03-05',
      priority: 'High',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#10b981';
      case 'Under Review': return '#f59e0b';
      case 'Pending': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Report Status</Text>
      {reports.map((report, index) => (
        <View key={index} style={styles.reportItem}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportId}>{report.id}</Text>
            <Text style={[styles.priority, { color: getPriorityColor(report.priority) }]}>
              {report.priority}
            </Text>
          </View>
          <Text style={styles.subject}>{report.subject}</Text>
          <Text style={styles.type}>{report.type}</Text>
          <View style={styles.reportFooter}>
            <Text style={styles.date}>{report.date}</Text>
            <Text style={[styles.status, { color: getStatusColor(report.status) }]}>
              {report.status}
            </Text>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.buttonText}>View All Reports</Text>
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
  header: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: width * 0.03,
  },
  reportItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    paddingLeft: width * 0.03,
    marginBottom: width * 0.03,
    paddingVertical: width * 0.02,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width * 0.01,
  },
  reportId: {
    fontSize: width * 0.03,
    color: '#6b7280',
    fontWeight: '500',
  },
  priority: {
    fontSize: width * 0.03,
    fontWeight: '600',
  },
  subject: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: width * 0.01,
  },
  type: {
    fontSize: width * 0.03,
    color: '#6b7280',
    marginBottom: width * 0.02,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: width * 0.03,
    color: '#6b7280',
  },
  status: {
    fontSize: width * 0.03,
    fontWeight: '600',
  },
  viewAllButton: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: width * 0.025,
    alignItems: 'center',
    marginTop: width * 0.02,
  },
  buttonText: {
    color: 'white',
    fontSize: width * 0.035,
    fontWeight: '600',
  },
});

export default ReportStatus;