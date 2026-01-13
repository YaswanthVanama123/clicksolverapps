/**
 * ServiceGrid.js - Organism Component
 * Grid layout for service categories with responsive columns
 * Composes ServiceCard molecules with pull-to-refresh and loading states
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
  Text,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {getColors} from '../../theme/colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * ServiceGrid Component
 * @param {Array} services - Array of service objects
 * @param {Function} onServicePress - Callback when service is pressed
 * @param {Function} onQuickBook - Callback for quick booking
 * @param {Number} numColumns - Number of columns (default: auto-responsive)
 * @param {Boolean} loading - Loading state
 * @param {Function} onRefresh - Pull-to-refresh callback
 * @param {Boolean} refreshing - Refreshing state
 */
const ServiceGrid = ({
  services = [],
  onServicePress,
  onQuickBook,
  numColumns,
  loading = false,
  onRefresh,
  refreshing = false,
}) => {
  const {width} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const colors = getColors(isDarkMode);
  const styles = dynamicStyles(width, isDarkMode, colors);

  // Determine responsive columns
  const getNumColumns = () => {
    if (numColumns) return numColumns;
    if (width >= 768) return 3; // Tablet: 3 columns
    if (width >= 600) return 2; // Large phone: 2 columns
    return 2; // Default: 2 columns
  };

  const columns = getNumColumns();

  // Render loading skeleton
  const renderSkeleton = () => {
    const skeletonItems = Array(6).fill(0);
    return (
      <View style={styles.container}>
        <View style={styles.gridContainer}>
          {skeletonItems.map((_, index) => (
            <View
              key={`skeleton-${index}`}
              style={[
                styles.skeletonCard,
                {width: width / columns - 24},
              ]}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonTextContainer}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonSubtitle} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name="grid-off"
        size={80}
        color={colors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>No Services Available</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for available services
      </Text>
    </View>
  );

  // Render service card item
  const renderServiceCard = ({item}) => (
    <ServiceCardItem
      service={item}
      onPress={() => onServicePress?.(item)}
      onQuickBook={() => onQuickBook?.(item)}
      width={width}
      columns={columns}
      isDarkMode={isDarkMode}
      colors={colors}
    />
  );

  // Show skeleton during initial load
  if (loading && services.length === 0) {
    return renderSkeleton();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={(item, index) => item.id?.toString() || `service-${index}`}
        numColumns={columns}
        key={`grid-${columns}`} // Force re-render when columns change
        contentContainerStyle={[
          styles.listContent,
          services.length === 0 && styles.emptyListContent,
        ]}
        columnWrapperStyle={columns > 1 ? styles.columnWrapper : null}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : null
        }
      />
    </View>
  );
};

/**
 * ServiceCardItem - Individual service card
 * This would ideally use a ServiceCard molecule component
 * For now, implementing inline to make it self-contained
 */
const ServiceCardItem = ({
  service,
  onPress,
  onQuickBook,
  width,
  columns,
  isDarkMode,
  colors,
}) => {
  const styles = dynamicStyles(width, isDarkMode, colors);
  const cardWidth = width / columns - 24;

  return (
    <View style={[styles.serviceCard, {width: cardWidth}]}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={onPress}
        activeOpacity={0.7}>
        {/* Service Image */}
        <View style={styles.imageContainer}>
          {service.imageUrl ? (
            <Image
              source={{uri: service.imageUrl}}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons
                name="home-repair-service"
                size={32}
                color={colors.text.tertiary}
              />
            </View>
          )}
          {service.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{service.badge}</Text>
            </View>
          )}
        </View>

        {/* Service Info */}
        <View style={styles.cardContent}>
          <Text style={styles.serviceName} numberOfLines={2}>
            {service.name}
          </Text>

          {service.rating && (
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={14} color="#FBBF24" />
              <Text style={styles.ratingText}>
                {service.rating} ({service.reviews || 0})
              </Text>
            </View>
          )}

          {service.price && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>From</Text>
              <Text style={styles.priceValue}>₹{service.price}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Quick Book Button */}
      {onQuickBook && (
        <TouchableOpacity
          style={styles.quickBookButton}
          onPress={onQuickBook}
          activeOpacity={0.8}>
          <MaterialIcons name="flash-on" size={16} color="#fff" />
          <Text style={styles.quickBookText}>Quick Book</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Import required components
import {TouchableOpacity, Image} from 'react-native';

const dynamicStyles = (width, isDarkMode, colors) => {
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    emptyListContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    columnWrapper: {
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingTop: 12,
    },

    // Service Card Styles
    serviceCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      marginHorizontal: 6,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    cardTouchable: {
      width: '100%',
    },
    imageContainer: {
      width: '100%',
      height: 140,
      position: 'relative',
    },
    serviceImage: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    cardContent: {
      padding: 12,
    },
    serviceName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 6,
      lineHeight: 18,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    ratingText: {
      fontSize: 12,
      color: colors.text.secondary,
      marginLeft: 4,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    priceLabel: {
      fontSize: 11,
      color: colors.text.tertiary,
      marginRight: 4,
    },
    priceValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    quickBookButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    quickBookText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 4,
    },

    // Empty State Styles
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: '700',
      color: colors.text.primary,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: isTablet ? 16 : 14,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    // Skeleton Styles
    skeletonCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 16,
      marginHorizontal: 6,
      overflow: 'hidden',
      height: 240,
    },
    skeletonImage: {
      width: '100%',
      height: 140,
      backgroundColor: isDarkMode ? '#2A2A3E' : '#E5E7EB',
    },
    skeletonTextContainer: {
      padding: 12,
    },
    skeletonTitle: {
      height: 16,
      backgroundColor: isDarkMode ? '#2A2A3E' : '#E5E7EB',
      borderRadius: 4,
      marginBottom: 8,
      width: '80%',
    },
    skeletonSubtitle: {
      height: 14,
      backgroundColor: isDarkMode ? '#2A2A3E' : '#E5E7EB',
      borderRadius: 4,
      width: '60%',
    },
  });
};

export default ServiceGrid;
