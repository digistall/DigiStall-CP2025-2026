import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';

const StallCard = ({ stall, onApply, applying }) => {
  const getStatusButton = (stall) => {
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
            <Text style={[styles.statusButtonText, styles.appliedButtonText]}>ALREADY APPLIED!</Text>
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

  return (
    <View style={styles.stallCard}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: stall.image }} style={styles.stallImage} />
        <TouchableOpacity style={styles.heartIcon}>
          <Text style={styles.heartText}>♥</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.stallInfo}>
          <View style={styles.stallNumberContainer}>
            <Text style={styles.stallLabel}>STALL#</Text>
            <Text style={styles.stallNumber}>{stall.stallNumber}</Text>
          </View>
          
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>{stall.location}</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{stall.price} Php / Monthly</Text>
          {stall.priceType && stall.priceType !== 'Fixed Price' && (
            <Text style={styles.priceTypeText}>({stall.priceType})</Text>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.floorText}>{stall.floor}</Text>
          <Text style={styles.sizeText}>{stall.size}</Text>
        </View>

        {stall.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{stall.description}</Text>
          </View>
        )}

        {getStatusButton(stall)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Reduced from 15
    marginBottom: 12, // Reduced from 15
    marginHorizontal: 16, // Add horizontal margin
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
    height: 120, // Reduced from 180
    backgroundColor: '#F3F4F6',
  },
  heartIcon: {
    position: 'absolute',
    top: 10, // Reduced from 15
    right: 10, // Reduced from 15
    backgroundColor: '#FFFFFF',
    width: 30, // Reduced from 35
    height: 30, // Reduced from 35
    borderRadius: 15, // Adjusted
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
    fontSize: 16,
    color: '#EF4444',
  },
  cardContent: {
    padding: 15, // Reduced from 20
  },
  stallInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stallNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  stallNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  locationContainer: {
    backgroundColor: '#002181',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceContainer: {
    marginBottom: 10,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  priceTypeText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  detailsContainer: {
    marginBottom: 15,
  },
  floorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sizeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  descriptionContainer: {
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statusButton: {
    paddingVertical: 10, // Reduced from 12
    paddingHorizontal: 16, // Reduced from 20
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
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
  limitReachedButton: {
    backgroundColor: '#DC2626',
  },
  limitReachedButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default StallCard;