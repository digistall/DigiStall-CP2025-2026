import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const PaymentRecord = () => {
  const paymentData = [
    { month: 'January 2024', amount: '₱2,500', status: 'Paid', date: '2024-01-15' },
    { month: 'February 2024', amount: '₱2,500', status: 'Paid', date: '2024-02-15' },
    { month: 'March 2024', amount: '₱2,500', status: 'Pending', date: '2024-03-15' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payment Records</Text>
      {paymentData.map((payment, index) => (
        <View key={index} style={styles.paymentItem}>
          <View style={styles.paymentInfo}>
            <Text style={styles.month}>{payment.month}</Text>
            <Text style={styles.date}>Due: {payment.date}</Text>
          </View>
          <View style={styles.paymentDetails}>
            <Text style={styles.amount}>{payment.amount}</Text>
            <Text style={[styles.status, 
              payment.status === 'Paid' ? styles.statusPaid : styles.statusPending]}>
              {payment.status}
            </Text>
          </View>
        </View>
      ))}
      <TouchableOpacity style={styles.viewAllButton}>
        <Text style={styles.buttonText}>View All Records</Text>
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
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: width * 0.03,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  paymentInfo: {
    flex: 1,
  },
  month: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#1f2937',
  },
  date: {
    fontSize: width * 0.03,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentDetails: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: width * 0.035,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  status: {
    fontSize: width * 0.03,
    fontWeight: '500',
    marginTop: 2,
  },
  statusPaid: {
    color: '#10b981',
  },
  statusPending: {
    color: '#f59e0b',
  },
  viewAllButton: {
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

export default PaymentRecord;