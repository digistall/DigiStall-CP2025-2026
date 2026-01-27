import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import ApiService from '@stall-holder-mobile/SERVICES/ApiService';

/**
 * AuthenticatedImage Component
 * Fetches images from authenticated endpoints and displays them
 * Uses API service to get base64 data with proper authentication
 */
const AuthenticatedImage = ({ 
  documentId, 
  style, 
  resizeMode = 'cover',
  onError,
  onLoad,
  placeholderColor = '#f1f5f9',
  showPlaceholder = true,
}) => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (!documentId) {
        setLoading(false);
        setError(true);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        // Use API service to fetch the image blob with authentication
        const response = await ApiService.getStallholderDocumentBlobById(documentId);
        
        if (isMounted) {
          if (response.success && response.data) {
            setImageData(response.data);
            onLoad && onLoad();
          } else {
            setError(true);
            onError && onError(new Error(response.message || 'Failed to load image'));
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('❌ AuthenticatedImage error:', err);
          setError(true);
          onError && onError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  if (loading) {
    return (
      <View style={[styles.container, style, { backgroundColor: placeholderColor }]}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  if (error || !imageData) {
    return (
      <View style={[styles.container, style, { backgroundColor: placeholderColor }]}>
        {showPlaceholder && (
          <>
            <Text style={styles.errorIcon}>📄</Text>
            <Text style={styles.errorText}>Preview unavailable</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageData }}
      style={style}
      resizeMode={resizeMode}
      onError={(e) => {
        console.error('❌ Image render error:', e.nativeEvent?.error);
        setError(true);
        onError && onError(e);
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default AuthenticatedImage;
