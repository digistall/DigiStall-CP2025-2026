import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NetworkUtils } from '../../../../config/shared/networkConfig';
import UserStorageService from '../../../../services/UserStorageService';

const SurrenderStallModal = ({ visible, onClose, stall, theme, isDarkMode, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [statusResult, setStatusResult] = useState(null);
  
  // Form State - Request
  const [reason, setReason] = useState('');
  const [moveOutDate, setMoveOutDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State - Survey
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Local popup states for blending with mobile app design
  const [localFeedback, setLocalFeedback] = useState(null);

  const colors = theme?.colors || {
    primary: '#002181',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    background: '#f8fafc',
    success: '#10b981',
    error: '#ef4444',
  };

  useEffect(() => {
    if (visible && stall) {
      checkStatus();
    } else {
      // Reset form on close
      resetForm();
    }
  }, [visible, stall]);

  const resetForm = () => {
    setReason('');
    setMoveOutDate(new Date());
    setShowDatePicker(false);
    setRating(0);
    setFeedback('');
    setStatusResult(null);
    setLocalFeedback(null);
  };

  const checkStatus = async () => {
    setLoading(true);
    setLocalFeedback(null);
    try {
      const token = await UserStorageService.getAuthToken();
      if (!token) throw new Error("No auth token");
      const server = await NetworkUtils.getActiveServer();
      
      const eligRes = await fetch(`${server}/api/mobile/surrender/eligibility/${stall.stall_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const eligData = await eligRes.json();
      
      const statRes = await fetch(`${server}/api/mobile/surrender/status/${stall.stall_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const statData = await statRes.json();
      
      if (eligRes.ok && statRes.ok) {
        let ineligibility_reasons = [];
        if (!eligData.data?.eligible) {
          if (eligData.data?.unpaidCount > 0) ineligibility_reasons.push(`You have ${eligData.data.unpaidCount} unpaid balance(s).`);
          if (eligData.data?.activeViolations > 0) ineligibility_reasons.push(`You have ${eligData.data.activeViolations} active violation(s).`);
          if (ineligibility_reasons.length === 0) ineligibility_reasons.push('Stallholder record invalid or not eligible.');
        }

        setStatusResult({
          eligible: eligData.data?.eligible ?? false,
          ineligibility_reasons,
          existing_request: statData.data || null
        });
      } else {
        setLocalFeedback({ type: 'error', message: 'Failed to verify status' });
      }
    } catch (err) {
      setLocalFeedback({ type: 'error', message: 'Connection Error' });
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!reason || !moveOutDate) {
      setLocalFeedback({ type: 'error', message: 'Please provide reason and move out date' });
      return;
    }
    setSubmitting(true);
    try {
      const token = await UserStorageService.getAuthToken();
      const server = await NetworkUtils.getActiveServer();
      
      // Format date to YYYY-MM-DD
      const formattedDate = moveOutDate.toISOString().split('T')[0];

      const res = await fetch(`${server}/api/mobile/surrender/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stall_id: stall.stall_id,
          reason,
          moveOutDate: formattedDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setLocalFeedback({ type: 'success', message: 'Surrender request submitted successfully.' });
        onSuccess && onSuccess();
        setTimeout(onClose, 2000);
      } else {
        setLocalFeedback({ type: 'error', message: data.message || 'Submission failed' });
      }
    } catch (err) {
      setLocalFeedback({ type: 'error', message: 'Connection Error' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitSurvey = async () => {
    if (rating === 0) {
      setLocalFeedback({ type: 'error', message: 'Please provide a rating' });
      return;
    }
    setSubmitting(true);
    try {
      const token = await UserStorageService.getAuthToken();
      const server = await NetworkUtils.getActiveServer();
      const res = await fetch(`${server}/api/mobile/surrender/exit-survey`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: statusResult?.existing_request?.request_id,
          stall_id: stall.stall_id,
          rating,
          feedback
        })
      });
      const data = await res.json();
      if (data.success) {
        setLocalFeedback({ type: 'success', message: 'Stall officially surrendered!' });
        onSuccess && onSuccess();
        setTimeout(onClose, 2000);
      } else {
        setLocalFeedback({ type: 'error', message: data.message || 'Submission failed' });
      }
    } catch (err) {
      setLocalFeedback({ type: 'error', message: 'Connection Error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Checking eligibility...</Text>
        </View>
      );
    }

    if (!statusResult) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="warning" size={48} color={colors.error} />
          <Text style={[styles.title, { color: colors.text }]}>Unable to Proceed</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            There was a problem checking your stall's status. Please try again later.
          </Text>
        </View>
      );
    }

    // SCENARIO 1: Not Eligible (Ineligible)
    if (!statusResult.eligible && !statusResult.existing_request) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color={colors.error} />
          <Text style={[styles.title, { color: colors.text }]}>Surrender Ineligible</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {statusResult.ineligibility_reasons?.join('\n') || 'You cannot surrender this stall right now.'}
          </Text>
        </View>
      );
    }

    // SCENARIO 2: Existing Request - Pending
    if (statusResult.existing_request && statusResult.existing_request.status === 'Pending') {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="time" size={48} color={colors.warning || '#f59e0b'} />
          <Text style={[styles.title, { color: colors.text }]}>Request Pending</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your surrender request is awaiting management approval.
          </Text>
        </View>
      );
    }

    // SCENARIO 3: Existing Request - Approved, Need Exit Survey
    if (statusResult.existing_request && statusResult.existing_request.status === 'Approved') {
      return (
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Exit Survey</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your surrender request has been approved. Please complete this brief survey to finalize the surrender process.
          </Text>
          
          <Text style={[styles.label, { color: colors.text }]}>How would you rate this stall location?</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons 
                  name={rating >= star ? "star" : "star-outline"} 
                  size={36} 
                  color="#f59e0b" 
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Message for the next tenant (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea, { 
              color: colors.text, borderColor: colors.border, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' 
            }]}
            placeholder="Share any tips or feedback about this spot..."
            placeholderTextColor={colors.textSecondary}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
          />
          
          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={submitSurvey}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Finalize Surrender</Text>}
          </TouchableOpacity>
        </View>
      );
    }

    // SCENARIO 4: Eligible to Request Surrender
    return (
      <View style={styles.formContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Surrender Stall</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Submit a request to permanently surrender {stall.stall_number}.
        </Text>
        
        <Text style={[styles.label, { color: colors.text }]}>Reason for Surrender</Text>
        <TextInput
          style={[styles.input, styles.textArea, { 
            color: colors.text, borderColor: colors.border, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' 
          }]}
          placeholder="Why are you surrendering this stall?"
          placeholderTextColor={colors.textSecondary}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Expected Move-out Date</Text>
        <TouchableOpacity 
          style={[styles.input, { 
            justifyContent: 'center', 
            color: colors.text, 
            borderColor: colors.border, 
            backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
            paddingVertical: 14
          }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={{ color: colors.text }}>
            {moveOutDate ? moveOutDate.toLocaleDateString() : 'Select a date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={moveOutDate || new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setMoveOutDate(selectedDate);
            }}
          />
        )}
        
        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={submitRequest}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Stall Lifecycle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={styles.body}>
            {localFeedback && (
              <View style={[
                styles.feedbackBox, 
                { backgroundColor: localFeedback.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }
              ]}>
                <Ionicons 
                  name={localFeedback.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                  size={20} 
                  color={localFeedback.type === 'error' ? colors.error : colors.success} 
                />
                <Text style={[
                  styles.feedbackText, 
                  { color: localFeedback.type === 'error' ? colors.error : colors.success }
                ]}>
                  {localFeedback.message}
                </Text>
              </View>
            )}

            {renderContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 8 }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  feedbackText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  }
});

export default SurrenderStallModal;
