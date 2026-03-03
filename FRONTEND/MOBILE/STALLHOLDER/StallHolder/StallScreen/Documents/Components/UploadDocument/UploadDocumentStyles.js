import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: height * 0.02,
    padding: width * 0.04,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  documentTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: height * 0.005,
  },
  documentDescription: {
    fontSize: width * 0.035,
    color: '#6b7280',
    marginBottom: height * 0.015,
    lineHeight: width * 0.045,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: height * 0.03,
    paddingHorizontal: width * 0.04,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  uploadIcon: {
    fontSize: width * 0.08,
    marginBottom: height * 0.01,
  },
  uploadButtonText: {
    fontSize: width * 0.04,
    fontWeight: '500',
    color: '#374151',
    marginBottom: height * 0.005,
  },
  uploadHint: {
    fontSize: width * 0.03,
    color: '#9ca3af',
    textAlign: 'center',
  },
  uploadedImageContainer: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: width * 0.6,
    height: width * 0.45,
    borderRadius: 8,
    marginBottom: height * 0.015,
    backgroundColor: '#f3f4f6',
  },
  imageActions: {
    flexDirection: 'row',
    gap: width * 0.03,
  },
  changeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: 6,
  },
  changeButtonText: {
    color: '#ffffff',
    fontSize: width * 0.035,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: width * 0.035,
    fontWeight: '500',
  },
});
