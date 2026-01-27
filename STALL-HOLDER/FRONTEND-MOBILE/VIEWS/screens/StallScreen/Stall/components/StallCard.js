import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import ApiService from '@stall-holder-mobile/SERVICES/ApiService';
import { NetworkUtils } from '@shared-mobile/CONFIG/networkConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive sizing - detect tablet (2 columns for better readability)
const isTablet = SCREEN_WIDTH >= 768;
const numColumns = isTablet ? 2 : 1;
const cardMargin = 12;
const containerPadding = 16;
const CARD_WIDTH = isTablet 
  ? (SCREEN_WIDTH - (containerPadding * 2) - (cardMargin * (numColumns - 1))) / numColumns 
  : SCREEN_WIDTH - (containerPadding * 2);
const CARD_IMAGE_HEIGHT = isTablet ? 140 : 180;

// Default stall image fallback
const DEFAULT_STALL_IMAGE = 'https://oldspitalfieldsmarket.com/cms/2017/10/OSM_FP_Stall_sq-1440x1440.jpg';

// Default theme colors for fallback
const defaultTheme = {
  colors: {
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1F2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    background: '#F3F4F6',
  }
};

const StallCard = ({ stall, onApply, applying, theme = defaultTheme, isDark = false, isFavorite = false, onToggleFavorite, cardWidth, onPress }) => {
  const colors = theme?.colors || defaultTheme.colors;
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const scrollViewRef = useRef(null);
  const autoSlideRef = useRef(null);
  
  // Use provided cardWidth or default
  const effectiveCardWidth = cardWidth || CARD_WIDTH;

  // Fetch stall images on mount
  useEffect(() => {
    fetchStallImages();
    return () => {
      // Cleanup auto-slide on unmount
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [stall.id]);

  // Auto-slide effect
  useEffect(() => {
    if (images.length > 1) {
      startAutoSlide();
    }
    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [images.length, currentImageIndex]);

  const startAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
    autoSlideRef.current = setInterval(() => {
      setCurrentImageIndex(prev => {
        const nextIndex = (prev + 1) % images.length;
        // Scroll to the next image
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: nextIndex * effectiveCardWidth, animated: true });
        }
        return nextIndex;
      });
    }, 3000); // Slide every 3 seconds
  };

  // Test if an image URL is accessible
  const testImage = (url) => {
    return new Promise((resolve) => {
      Image.prefetch(url)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  };

  // Get branch ID from stall object (handles different data structures)
  const getBranchId = () => {
    return stall.branch?.id || stall.branchId || stall.branch_id || 1;
  };

  // Get static file server URL for images
  const getImageBaseUrl = () => {
    return NetworkUtils.getStaticFileServer();
  };

  // Get API base URL for BLOB images
  const getApiBaseUrl = () => {
    return NetworkUtils.getApiUrl();
  };

  // Fetch stall images from BLOB storage API
  const fetchStallImages = async () => {
    try {
      setLoadingImages(true);
      
      const apiBaseUrl = getApiBaseUrl();
      const stallId = stall.id || stall.stall_id;
      
      console.log(`📷 Card: Fetching images for stall ${stallId} from BLOB API...`);

      if (!stallId) {
        setImages([{ id: 'default', image_url: stall.image || DEFAULT_STALL_IMAGE, is_primary: true }]);
        setLoadingImages(false);
        return;
      }

      try {
        // Use BLOB API endpoint to get images
        const response = await ApiService.get(`/stalls/${stallId}/images/blob`);
        
        if (response.success && response.data?.images && response.data.images.length > 0) {
          // Map images to use BLOB serving endpoint
          const blobImages = response.data.images.map(img => ({
            id: img.id,
            stall_id: stallId,
            image_url: `${apiBaseUrl}/api/mobile/stalls/images/blob/id/${img.id}`,
            display_order: img.display_order,
            is_primary: img.is_primary,
          }));
          
          console.log(`📷 Card: Found ${blobImages.length} images in BLOB storage for stall ${stallId}`);
          setImages(blobImages);
        } else {
          console.log(`📷 Card: No BLOB images found for stall ${stallId}, using fallback`);
          // Use stall's primary image or default
          if (stall.image && !stall.image.includes('oldspitalfieldsmarket')) {
            setImages([{ id: 'primary', image_url: stall.image, is_primary: true }]);
          } else {
            setImages([{ id: 'default', image_url: DEFAULT_STALL_IMAGE, is_primary: true }]);
          }
        }
      } catch (apiError) {
        console.log(`📷 Card: BLOB API error for stall ${stallId}:`, apiError.message);
        // Fallback to default image
        if (stall.image && !stall.image.includes('oldspitalfieldsmarket')) {
          setImages([{ id: 'primary', image_url: stall.image, is_primary: true }]);
        } else {
          setImages([{ id: 'default', image_url: DEFAULT_STALL_IMAGE, is_primary: true }]);
        }
      }
    } catch (error) {
      console.error('Error setting up stall images:', error);
      setImages([{ id: 'default', image_url: stall.image || DEFAULT_STALL_IMAGE, is_primary: true }]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / effectiveCardWidth);
    if (index !== currentImageIndex && index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
      // Reset auto-slide timer when user manually scrolls
      startAutoSlide();
    }
  };

  const handleImageError = (index) => {
    // Replace failed image with default
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, image_url: DEFAULT_STALL_IMAGE } : img
    ));
  };

  const handleFavoritePress = () => {
    if (onToggleFavorite) {
      onToggleFavorite(stall.id);
    }
  };

  const getStatusButton = (stall) => {
    // Check if user has already joined raffle
    if (stall.hasJoinedRaffle || stall.status === 'joined_raffle') {
      return (
        <TouchableOpacity style={[styles.statusButton, styles.joinedButton]} disabled>
          <Text style={[styles.statusButtonText, styles.joinedButtonText]}>ALREADY JOINED!</Text>
        </TouchableOpacity>
      );
    }
    
    // Check if user has already joined auction
    if (stall.hasJoinedAuction || stall.status === 'joined_auction') {
      return (
        <TouchableOpacity style={[styles.statusButton, styles.joinedButton]} disabled>
          <Text style={[styles.statusButtonText, styles.joinedButtonText]}>ALREADY JOINED!</Text>
        </TouchableOpacity>
      );
    }
    
    // If user cannot apply (based on backend logic)
    if (!stall.canApply) {
      if (stall.maxApplicationsReached) {
        return (
          <TouchableOpacity style={[styles.statusButton, styles.limitReachedButton]} disabled>
            <Text style={[styles.statusButtonText, styles.limitReachedButtonText]}>
              LIMIT REACHED ({stall.applicationsInBranch}/2)
            </Text>
          </TouchableOpacity>
        );
      } else if (stall.status === 'applied') {
        return (
          <TouchableOpacity style={[styles.statusButton, styles.appliedButton]} disabled>
            <Text style={[styles.statusButtonText, styles.appliedButtonText]}>ALREADY JOINED!</Text>
          </TouchableOpacity>
        );
      }
    }

    // Handle different price types and statuses
    switch (stall.priceType) {
      case 'Fixed Price':
        return (
          <TouchableOpacity 
            style={[styles.statusButton, styles.availableButton]}
            onPress={() => onApply && onApply(stall)}
            disabled={applying || !stall.canApply}
          >
            {applying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[styles.statusButtonText, styles.availableButtonText]}>APPLY NOW!</Text>
            )}
          </TouchableOpacity>
        );
      case 'Raffle':
        return (
          <TouchableOpacity 
            style={[styles.statusButton, styles.raffleButton]}
            onPress={() => onApply && onApply(stall)}
            disabled={applying || !stall.canApply}
          >
            {applying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[styles.statusButtonText, styles.raffleButtonText]}>JOIN RAFFLE</Text>
            )}
          </TouchableOpacity>
        );
      case 'Auction':
        return (
          <TouchableOpacity 
            style={[styles.statusButton, styles.auctionButton]}
            onPress={() => onApply && onApply(stall)}
            disabled={applying || !stall.canApply}
          >
            {applying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[styles.statusButtonText, styles.auctionButtonText]}>JOIN AUCTION</Text>
            )}
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity style={[styles.statusButton, styles.lockedButton]} disabled>
            <Text style={[styles.statusButtonText, styles.lockedButtonText]}>🔒 NOT AVAILABLE</Text>
          </TouchableOpacity>
        );
    }
  };

  // Dynamic styles based on card width
  const dynamicStyles = {
    cardWidth: { width: effectiveCardWidth },
    imageHeight: { height: CARD_IMAGE_HEIGHT },
  };

  // Handle card press to open details
  const handleCardPress = () => {
    if (onPress) {
      onPress(stall);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={handleCardPress}
      style={[styles.stallCard, dynamicStyles.cardWidth, { backgroundColor: colors.card }]}
    >
      <View style={styles.cardHeader}>
        {/* Image Slider */}
        {loadingImages ? (
          <View style={[styles.stallImage, styles.imageLoading, dynamicStyles.imageHeight, { backgroundColor: isDark ? colors.surface : '#F3F4F6' }]}>
            <ActivityIndicator size="small" color="#002181" />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={[styles.imageSlider, dynamicStyles.imageHeight]}
          >
            {images.map((img, index) => (
              <Image 
                key={img.id || index}
                source={{ uri: img.image_url }} 
                style={[styles.stallImage, { width: effectiveCardWidth, backgroundColor: isDark ? colors.surface : '#F3F4F6' }, dynamicStyles.imageHeight]} 
                onError={() => handleImageError(index)}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}
        
        {/* Image Pagination Dots */}
        {images.length > 1 && (
          <View style={styles.paginationDots}>
            {images.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.dot, 
                  index === currentImageIndex ? styles.dotActive : styles.dotInactive
                ]} 
              />
            ))}
          </View>
        )}
        
        {/* Favorite Heart Button */}
        <TouchableOpacity 
          style={[styles.heartIcon, isFavorite && styles.heartIconActive]} 
          onPress={(e) => { e.stopPropagation(); handleFavoritePress(); }}
        >
          <Text style={[styles.heartText, isFavorite ? styles.heartFilled : styles.heartEmpty]}>
            {isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
        
        {/* Image Counter */}
        {images.length > 1 && (
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>{currentImageIndex + 1}/{images.length}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.stallInfo}>
          <View style={[styles.stallNumberContainer, { backgroundColor: isDark ? colors.surface : '#F3F4F6' }]}>
            <Text style={[styles.stallLabel, { color: colors.textSecondary }]}>STALL#</Text>
            <Text style={[styles.stallNumber, { color: colors.text }]}>{stall.stallNumber}</Text>
          </View>
          
          <View style={styles.locationContainer}>
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{stall.location}</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.priceText, { color: colors.text }]}>{stall.price} Php / Monthly</Text>
          {stall.priceType && stall.priceType !== 'Fixed Price' && (
            <Text style={[styles.priceTypeText, { color: colors.textSecondary }]}>({stall.priceType})</Text>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={[styles.floorText, { color: colors.textSecondary }]}>{stall.floor}</Text>
          <Text style={[styles.sizeText, { color: colors.textSecondary }]}>{stall.size}</Text>
        </View>

        {stall.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={2}>{stall.description}</Text>
          </View>
        )}

        {getStatusButton(stall)}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  stallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: isTablet ? 0 : 16, // Tablet uses columnWrapper marginBottom, mobile uses this
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    position: 'relative',
  },
  stallImage: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
    backgroundColor: '#F3F4F6',
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heartText: {
    fontSize: 18,
    color: '#EF4444',
  },
  cardContent: {
    padding: isTablet ? 12 : 15,
  },
  stallInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isTablet ? 6 : 10,
  },
  stallNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: isTablet ? 8 : 12,
    paddingVertical: isTablet ? 4 : 6,
    borderRadius: 20,
  },
  stallLabel: {
    fontSize: isTablet ? 10 : 12,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  stallNumber: {
    fontSize: isTablet ? 11 : 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  locationContainer: {
    backgroundColor: '#002181',
    paddingHorizontal: isTablet ? 8 : 12,
    paddingVertical: isTablet ? 4 : 6,
    borderRadius: 15,
  },
  locationText: {
    fontSize: isTablet ? 10 : 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceContainer: {
    marginBottom: isTablet ? 6 : 10,
  },
  priceText: {
    fontSize: isTablet ? 14 : 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  priceTypeText: {
    fontSize: isTablet ? 10 : 12,
    color: '#6B7280',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  detailsContainer: {
    marginBottom: isTablet ? 8 : 15,
  },
  floorText: {
    fontSize: isTablet ? 11 : 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sizeText: {
    fontSize: isTablet ? 11 : 14,
    color: '#6B7280',
  },
  descriptionContainer: {
    marginBottom: isTablet ? 6 : 10,
  },
  descriptionText: {
    fontSize: isTablet ? 10 : 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statusButton: {
    paddingVertical: isTablet ? 6 : 10,
    paddingHorizontal: isTablet ? 10 : 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: isTablet ? 11 : 14,
    fontWeight: 'bold',
  },
  availableButton: {
    backgroundColor: '#002181',
  },
  availableButtonText: {
    color: '#FFFFFF',
  },
  lockedButton: {
    backgroundColor: '#9CA3AF',
  },
  lockedButtonText: {
    color: '#FFFFFF',
  },
  raffleButton: {
    backgroundColor: '#002181',
  },
  raffleButtonText: {
    color: '#FFFFFF',
  },
  auctionButton: {
    backgroundColor: '#F59E0B',
  },
  auctionButtonText: {
    color: '#FFFFFF',
  },
  appliedButton: {
    backgroundColor: '#9CA3AF',
  },
  appliedButtonText: {
    color: '#FFFFFF',
  },
  joinedButton: {
    backgroundColor: '#9CA3AF', // Same gray as appliedButton for consistency
  },
  joinedButtonText: {
    color: '#FFFFFF',
  },
  limitReachedButton: {
    backgroundColor: '#DC2626',
  },
  limitReachedButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  // Image Slider Styles
  imageSlider: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
  },
  imageLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    height: CARD_IMAGE_HEIGHT,
  },
  // Pagination Dots
  paginationDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#002181',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#002181',
  },
  // Image Counter
  imageCounter: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  // Heart/Favorite Styles
  heartIconActive: {
    backgroundColor: '#FEE2E2',
  },
  heartFilled: {
    color: '#EF4444',
    fontSize: 18,
  },
  heartEmpty: {
    color: '#9CA3AF',
    fontSize: 18,
  },
});

export default StallCard;