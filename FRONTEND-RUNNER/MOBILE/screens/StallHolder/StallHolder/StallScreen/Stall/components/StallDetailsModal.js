import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { NetworkUtils } from '../../../../../../config/shared/networkConfig';
import ApiService from "../../../../../../services/ApiService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default stall image fallback
const DEFAULT_STALL_IMAGE = 'https://oldspitalfieldsmarket.com/cms/2017/10/OSM_FP_Stall_sq-1440x1440.jpg';

const StallDetailsModal = ({
  visible,
  stall,
  onClose,
  onApply,
  applying,
  theme,
  isDark,
  isFavorite,
  onToggleFavorite,
}) => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(true);
  const scrollViewRef = useRef(null);
  const autoSlideRef = useRef(null);

  const colors = theme?.colors || {
    surface: '#ffffff',
    card: '#ffffff',
    text: '#1F2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    background: '#F3F4F6',
    primary: '#002181',
  };

  // Get API base URL for BLOB images
  const getApiBaseUrl = () => {
    return NetworkUtils.getApiUrl();
  };

  // Fetch all images from BLOB storage API
  const fetchAllImages = async () => {
    if (!stall) return;
    
    try {
      setLoadingImages(true);
      const apiBaseUrl = getApiBaseUrl();
      const stallId = stall.id || stall.stall_id;

      console.log(`📷 Modal: Fetching images for stall ${stallId} from BLOB API...`);

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
          
          console.log(`📷 Modal: Found ${blobImages.length} images in BLOB storage for stall ${stallId}`);
          setImages(blobImages);
        } else {
          console.log(`📷 Modal: No BLOB images found for stall ${stallId}, using fallback`);
          // Use stall's primary image or default
          if (stall.image && !stall.image.includes('oldspitalfieldsmarket')) {
            setImages([{ id: 'primary', image_url: stall.image, is_primary: true }]);
          } else {
            setImages([{ id: 'default', image_url: DEFAULT_STALL_IMAGE, is_primary: true }]);
          }
        }
      } catch (apiError) {
        console.log(`📷 Modal: BLOB API error for stall ${stallId}:`, apiError.message);
        // Fallback to default image
        if (stall.image && !stall.image.includes('oldspitalfieldsmarket')) {
          setImages([{ id: 'primary', image_url: stall.image, is_primary: true }]);
        } else {
          setImages([{ id: 'default', image_url: DEFAULT_STALL_IMAGE, is_primary: true }]);
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setImages([{ id: 'default', image_url: DEFAULT_STALL_IMAGE, is_primary: true }]);
    } finally {
      setLoadingImages(false);
    }
  };

  // Auto-slide effect
  const startAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
    if (images.length > 1) {
      autoSlideRef.current = setInterval(() => {
        setCurrentImageIndex(prev => {
          const nextIndex = (prev + 1) % images.length;
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
          }
          return nextIndex;
        });
      }, 3000);
    }
  };

  useEffect(() => {
    if (visible && stall) {
      setCurrentImageIndex(0);
      fetchAllImages();
    }
    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [visible, stall?.id]);

  useEffect(() => {
    if (images.length > 1 && visible) {
      startAutoSlide();
    }
    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [images.length, visible]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    if (index !== currentImageIndex && index >= 0 && index < images.length) {
      setCurrentImageIndex(index);
      startAutoSlide();
    }
  };

  const handleImageError = (index) => {
    setImages(prev => prev.map((img, i) =>
      i === index ? { ...img, image_url: DEFAULT_STALL_IMAGE } : img
    ));
  };

  const handleFavoritePress = () => {
    if (onToggleFavorite) {
      onToggleFavorite(stall.id);
    }
  };

  const goToPrevImage = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    setCurrentImageIndex(newIndex);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: newIndex * SCREEN_WIDTH, animated: true });
    }
    startAutoSlide();
  };

  const goToNextImage = () => {
    const newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: newIndex * SCREEN_WIDTH, animated: true });
    }
    startAutoSlide();
  };

  const getStatusButton = () => {
    // Check if user has already joined raffle
    if (stall?.hasJoinedRaffle || stall?.status === 'joined_raffle') {
      return (
        <TouchableOpacity style={[styles.applyButton, styles.joinedButton]} disabled>
          <Text style={styles.applyButtonText}>ALREADY JOINED!</Text>
        </TouchableOpacity>
      );
    }
    
    // Check if user has already joined auction
    if (stall?.hasJoinedAuction || stall?.status === 'joined_auction') {
      return (
        <TouchableOpacity style={[styles.applyButton, styles.joinedButton]} disabled>
          <Text style={styles.applyButtonText}>ALREADY JOINED!</Text>
        </TouchableOpacity>
      );
    }
    
    if (!stall?.canApply) {
      if (stall?.maxApplicationsReached) {
        return (
          <TouchableOpacity style={[styles.applyButton, styles.limitReachedButton]} disabled>
            <Text style={styles.applyButtonText}>LIMIT REACHED ({stall.applicationsInBranch}/2)</Text>
          </TouchableOpacity>
        );
      } else if (stall?.status === 'applied') {
        return (
          <TouchableOpacity style={[styles.applyButton, styles.appliedButton]} disabled>
            <Text style={styles.applyButtonText}>ALREADY JOINED!</Text>
          </TouchableOpacity>
        );
      }
    }

    switch (stall?.priceType) {
      case 'Fixed Price':
        return (
          <TouchableOpacity
            style={[styles.applyButton, styles.availableButton]}
            onPress={() => onApply && onApply(stall)}
            disabled={applying || !stall?.canApply}
          >
            {applying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.applyButtonText}>APPLY NOW!</Text>
            )}
          </TouchableOpacity>
        );
      case 'Raffle':
        return (
          <TouchableOpacity
            style={[styles.applyButton, styles.raffleButton]}
            onPress={() => onApply && onApply(stall)}
            disabled={applying || !stall?.canApply}
          >
            {applying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.applyButtonText}>JOIN RAFFLE</Text>
            )}
          </TouchableOpacity>
        );
      case 'Auction':
        return (
          <TouchableOpacity
            style={[styles.applyButton, styles.auctionButton]}
            onPress={() => onApply && onApply(stall)}
            disabled={applying || !stall?.canApply}
          >
            {applying ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.applyButtonText}>JOIN AUCTION</Text>
            )}
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity style={[styles.applyButton, styles.lockedButton]} disabled>
            <Text style={styles.applyButtonText}>NOT AVAILABLE</Text>
          </TouchableOpacity>
        );
    }
  };

  if (!stall) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.9)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            onPress={handleFavoritePress}
          >
            <Text style={[styles.favoriteText, isFavorite ? styles.favoriteFilled : styles.favoriteEmpty]}>
              {isFavorite ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Hero Image Section */}
            <View style={styles.heroSection}>
              {loadingImages ? (
                <View style={styles.imageLoading}>
                  <ActivityIndicator size="large" color="#002181" />
                </View>
              ) : (
                <ScrollView
                  ref={scrollViewRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleScroll}
                  style={styles.imageSlider}
                >
                  {images.map((img, index) => (
                    <Image
                      key={img.id || index}
                      source={{ uri: img.image_url }}
                      style={styles.heroImage}
                      onError={() => handleImageError(index)}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <TouchableOpacity style={[styles.navArrow, styles.navArrowLeft]} onPress={goToPrevImage}>
                    <Text style={styles.navArrowText}>‹</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.navArrow, styles.navArrowRight]} onPress={goToNextImage}>
                    <Text style={styles.navArrowText}>›</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Gradient Overlay */}
              <View style={styles.heroGradient} />

              {/* Stall Badge */}
              <View style={styles.heroBadge}>
                <Text style={styles.badgeNumber}>{stall.stallNumber}</Text>
                <View style={[styles.badgeStatus, stall.canApply ? styles.badgeAvailable : styles.badgeOccupied]}>
                  <Text style={styles.badgeStatusText}>
                    {stall.canApply 
                      ? 'Available' 
                      : stall.status === 'applied' 
                        ? 'Applied' 
                        : (stall.status === 'joined_raffle' || stall.hasJoinedRaffle)
                          ? 'Applied'
                          : (stall.status === 'joined_auction' || stall.hasJoinedAuction)
                            ? 'Joined Auction'
                            : 'Unavailable'}
                  </Text>
                </View>
              </View>

              {/* Image Counter */}
              {images.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>{currentImageIndex + 1}/{images.length}</Text>
                </View>
              )}

              {/* Pagination Dots */}
              {images.length > 1 && (
                <View style={styles.paginationDots}>
                  {images.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dot, index === currentImageIndex ? styles.dotActive : styles.dotInactive]}
                      onPress={() => {
                        setCurrentImageIndex(index);
                        if (scrollViewRef.current) {
                          scrollViewRef.current.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
                        }
                        startAutoSlide();
                      }}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Info Section */}
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              {/* Price Section */}
              <View style={styles.priceSection}>
                <Text style={styles.priceLabel}>Monthly Rent</Text>
                <Text style={styles.priceAmount}>₱{stall.price}</Text>
                <Text style={styles.priceType}>{stall.priceType || 'Fixed Price'}</Text>
              </View>

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Floor & Section</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{stall.floor || stall.floorSection}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dimensions</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{stall.size || stall.dimensions}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Location</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{stall.branch?.name || stall.location}</Text>
                  </View>
                </View>

                {stall.branch?.area && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailContent}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Area</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{stall.branch.area}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Description */}
              {stall.description && (
                <View style={styles.descriptionSection}>
                  <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>About this stall</Text>
                  <Text style={[styles.descriptionText, { color: colors.text }]}>{stall.description}</Text>
                </View>
              )}

              {/* Apply Button */}
              <View style={styles.buttonContainer}>
                {getStatusButton()}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.92,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 60,
    zIndex: 100,
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  favoriteButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  favoriteText: {
    fontSize: 20,
  },
  favoriteFilled: {
    color: '#EF4444',
  },
  favoriteEmpty: {
    color: '#9CA3AF',
  },
  heroSection: {
    position: 'relative',
    height: SCREEN_HEIGHT * 0.35,
  },
  imageSlider: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.35,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.35,
    backgroundColor: '#F3F4F6',
  },
  imageLoading: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 40,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navArrowLeft: {
    left: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  navArrowRight: {
    right: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  navArrowText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  heroBadge: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeNumber: {
    backgroundColor: '#002181',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
  },
  badgeStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeAvailable: {
    backgroundColor: '#10B981',
  },
  badgeOccupied: {
    backgroundColor: '#9CA3AF',
  },
  badgeStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 60,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 20,
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
  infoCard: {
    padding: 20,
    paddingBottom: 40,
  },
  priceSection: {
    backgroundColor: '#F0F4FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#002181',
    marginBottom: 4,
  },
  priceType: {
    fontSize: 12,
    color: '#002181',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailsGrid: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  buttonContainer: {
    marginTop: 10,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  availableButton: {
    backgroundColor: '#002181',
  },
  raffleButton: {
    backgroundColor: '#7C3AED',
  },
  auctionButton: {
    backgroundColor: '#F59E0B',
  },
  appliedButton: {
    backgroundColor: '#9CA3AF',
  },
  joinedButton: {
    backgroundColor: '#9CA3AF', // Same gray as appliedButton for consistency
  },
  limitReachedButton: {
    backgroundColor: '#DC2626',
  },
  lockedButton: {
    backgroundColor: '#9CA3AF',
  },
});

export default StallDetailsModal;
