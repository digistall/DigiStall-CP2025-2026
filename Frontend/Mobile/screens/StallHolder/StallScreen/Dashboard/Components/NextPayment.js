import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const NextPayment = () => {
  const nextPayment = {
    amount: '₱2,500',
    dueDate: '2024-04-15',
    daysLeft: 12,
    type: 'Monthly Rent',
    stallNumber: 'A-45',
  };

  const getDaysLeftColor = (days) => {
    if (days <= 3) return '#ef4444';
    if (days <= 7) return '#f59e0b';
    return '#10b981';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Next Payment</Text>
      <View style={styles.paymentCard}>
        <View style={styles.amountSection}>
          <Text style={styles.amount}>{nextPayment.amount}</Text>
          <Text style={styles.type}>{nextPayment.type}</Text>
        </View>
        <View style={styles.dueSection}>
          <Text style={styles.dueDate}>Due: {nextPayment.dueDate}</Text>
          <Text style={[styles.daysLeft, { color: getDaysLeftColor(nextPayment.daysLeft) }]}>
            {nextPayment.daysLeft} days left
          </Text>
        </View>
      </View>
      <View style={styles.stallInfo}>
        <Text style={styles.stallNumber}>Stall: {nextPayment.stallNumber}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.payButton}>
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reminderButton}>
          <Text style={styles.reminderButtonText}>Set Reminder</Text>
        </TouchableOpacity>
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
  paymentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: width * 0.04,
    marginBottom: width * 0.03,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: width * 0.02,
  },
  amount: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  type: {
    fontSize: width * 0.035,
    color: '#6b7280',
    marginTop: width * 0.01,
  },
  dueSection: {
    alignItems: 'center',
  },
  dueDate: {
    fontSize: width * 0.035,
    color: '#1f2937',
    fontWeight: '500',
  },
  daysLeft: {
    fontSize: width * 0.03,
    fontWeight: '600',
    marginTop: width * 0.01,
  },
  stallInfo: {
    alignItems: 'center',
    marginBottom: width * 0.04,
  },
  stallNumber: {
    fontSize: width * 0.035,
    color: '#6b7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: width * 0.03,
  },
  payButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: width * 0.03,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: width * 0.035,
    fontWeight: '600',
  },
  reminderButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 6,
    paddingVertical: width * 0.03,
    alignItems: 'center',
  },
  reminderButtonText: {
    color: '#2563eb',
    fontSize: width * 0.035,
    fontWeight: '600',
  },
});

export default NextPayment;