import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../Settings/components/ThemeComponents/ThemeContext';

const { width, height } = Dimensions.get('window');

const DocumentPreviewModal = ({
  visible,
  onClose,
  document,
  onDelete,
  onReplace,
  isLoading = false,
}) => {
  const { theme, isDark } = useTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const [scale, setScale] = useState(1);

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document?.file_name || 'this document'}"?\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete();
            onClose();
          },
        },
      ]
    );
  };

  const handleReplace = () => {
    onReplace();
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      case 'expired':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return '✓ Verified';
      case 'pending':
        return '⏱ Pending';
      case 'rejected':
        return '✗ Rejected';
      case 'expired':
        return '⚠ Expired';
      default:
        return '○ Not Verified';
    }
  };

  const isImage = document?.mime_type?.startsWith('image/');
  const isPDF = document?.mime_type === 'application/pdf';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.colors.text }]}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>Document Preview</Text>
            <View style={{ width: 40 }} />
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Loading document...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
            >
              {/* Document Preview */}
              <View style={[styles.previewContainer, { backgroundColor: isDark ? theme.colors.card : '#f1f5f9' }]}>
                {isImage && document?.document_data ? (
                  <Image
                    source={{ uri: document.document_data }}
                    style={[
                      styles.documentImage,
                      { transform: [{ scale }] },
                    ]}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    resizeMode="contain"
                  />
                ) : isPDF ? (
                  <View style={styles.pdfPlaceholder}>
                    <Text style={[styles.pdfIcon, { color: theme.colors.textSecondary }]}>📄</Text>
                    <Text style={[styles.pdfText, { color: theme.colors.textSecondary }]}>
                      PDF Document
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noPreviewContainer}>
                    <Text style={[styles.noPreviewIcon, { color: theme.colors.textSecondary }]}>
                      📄
                    </Text>
                    <Text style={[styles.noPreviewText, { color: theme.colors.textSecondary }]}>
                      No preview available
                    </Text>
                  </View>
                )}

                {imageLoading && isImage && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  </View>
                )}
              </View>

              {/* Document Details */}
              <View style={[styles.detailsContainer, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>Document Details</Text>

                {/* Document Name */}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Document
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {document?.document_name || 'Document'}
                  </Text>
                </View>

                {/* File Name */}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    File Name
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]} numberOfLines={2}>
                    {document?.file_name || document?.original_filename || 'Not available'}
                  </Text>
                </View>

                {/* File Type */}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Type
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {document?.mime_type 
                      ? document.mime_type.split('/')[1]?.toUpperCase() || document.mime_type
                      : 'Image'}
                  </Text>
                </View>

                {/* File Size */}
                {document?.file_size && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      Size
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {document.file_size > 1024 * 1024 
                        ? `${(document.file_size / (1024 * 1024)).toFixed(2)} MB`
                        : `${(document.file_size / 1024).toFixed(2)} KB`}
                    </Text>
                  </View>
                )}

                {/* Status - supports both 'status' and 'verification_status' fields */}
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Status
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(document?.verification_status || document?.status || 'pending') },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusIcon(document?.verification_status || document?.status || 'pending')}
                    </Text>
                  </View>
                </View>

                {/* Upload Date */}
                {document?.upload_date && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      Uploaded
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {new Date(document.upload_date).toLocaleDateString()} at{' '}
                      {new Date(document.upload_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}

                {/* Expiry Date */}
                {document?.expiry_date && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      Expires
                    </Text>
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color:
                            document.days_until_expiry < 0
                              ? '#ef4444'
                              : document.days_until_expiry <= 30
                              ? '#f59e0b'
                              : theme.colors.text,
                        },
                      ]}
                    >
                      {new Date(document.expiry_date).toLocaleDateString()}
                      {document.days_until_expiry !== undefined && (
                        <Text>
                          {' '}
                          ({document.days_until_expiry < 0
                            ? `Expired ${Math.abs(document.days_until_expiry)} days ago`
                            : `${document.days_until_expiry} days left`}
                          )
                        </Text>
                      )}
                    </Text>
                  </View>
                )}

                {/* Rejection Reason */}
                {document?.rejection_reason && (
                  <View style={[styles.rejectionContainer, { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' }]}>
                    <Text style={[styles.rejectionLabel, { color: '#dc2626' }]}>Rejection Reason</Text>
                    <Text style={[styles.rejectionText, { color: '#991b1b' }]}>
                      {document.rejection_reason}
                    </Text>
                  </View>
                )}

                {/* Notes */}
                {document?.notes && (
                  <View style={[styles.notesContainer, { backgroundColor: isDark ? theme.colors.surface : '#f0f9ff' }]}>
                    <Text style={[styles.notesLabel, { color: theme.colors.textSecondary }]}>Notes</Text>
                    <Text style={[styles.notesText, { color: theme.colors.text }]}>
                      {document.notes}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}

          {/* Footer Actions */}
          {!isLoading && (
            <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              
              {/* Only show Replace button if document is not verified */}
              {(document?.verification_status !== 'verified' && document?.status !== 'verified') && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  onPress={handleReplace}
                >
                  <Text style={styles.buttonText}>Replace</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.closeActionButton]}
                onPress={onClose}
              >
                <Text style={[styles.closeActionText, { color: theme.colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    height: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  pdfIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  pdfText: {
    fontSize: 16,
    fontWeight: '600',
  },
  noPreviewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  noPreviewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noPreviewText: {
    fontSize: 14,
  },
  detailsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectionContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  notesContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeActionButton: {
    backgroundColor: '#f1f5f9',
  },
  closeActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DocumentPreviewModal;
