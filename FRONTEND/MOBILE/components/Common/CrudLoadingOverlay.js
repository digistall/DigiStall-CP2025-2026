import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';

/**
 * CrudLoadingOverlay - Full-screen loading overlay for CRUD operations
 * Usage: <CrudLoadingOverlay {...overlayProps} theme={theme} />
 */
const CrudLoadingOverlay = ({ isVisible, action, subject, theme }) => {
  if (!isVisible) return null;

  const getMessage = () => {
    const actionMessages = {
      submit: 'Submitting',
      create: 'Creating',
      update: 'Updating',
      delete: 'Deleting',
      loading: 'Loading',
      save: 'Saving',
      upload: 'Uploading',
      download: 'Downloading',
      fetch: 'Fetching',
    };

    const actionText = actionMessages[action] || action || 'Processing';
    return subject ? `${actionText} ${subject}...` : `${actionText}...`;
  };

  const backgroundColor = theme?.colors?.background || '#121212';
  const textColor = theme?.colors?.text || '#ffffff';
  const primaryColor = theme?.colors?.primary || '#4CAF50';

  return (
    <Modal transparent visible={isVisible} animationType="fade">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
        <View style={[styles.container, { backgroundColor }]}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.message, { color: textColor }]}>{getMessage()}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CrudLoadingOverlay;
