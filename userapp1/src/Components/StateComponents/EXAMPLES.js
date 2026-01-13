/**
 * QUICK START - Integration Examples
 * ===================================
 * Copy and paste ready examples for common use cases
 */

// ============================================================================
// EXAMPLE 1: Simple Services List with All States
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import {
  LoadingState,
  EmptyState,
  ErrorState,
  SkeletonServiceCard,
} from '../StateComponents';

export const ServicesListExample = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      // Replace with actual API call
      const response = await fetch('https://api.example.com/services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial loading state
  if (loading && services.length === 0) {
    return <LoadingState message="Discovering services for you..." />;
  }

  // Error state
  if (error && services.length === 0) {
    return (
      <ErrorState
        error={error}
        onRetry={fetchServices}
        title="Failed to Load Services"
      />
    );
  }

  // Empty state
  if (services.length === 0) {
    return (
      <EmptyState
        icon="folder-open"
        title="No Services Available"
        message="We're updating our service list. Please check back soon!"
        actionLabel="Refresh"
        onAction={fetchServices}
      />
    );
  }

  // Success state with skeleton loading on refresh
  return (
    <FlatList
      data={services}
      renderItem={({ item }) => (
        <View style={styles.cardContainer}>
          {/* Your ServiceCard component here */}
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={loading && (
        <FlatList
          scrollEnabled={false}
          data={[1, 2]}
          renderItem={() => <SkeletonServiceCard />}
          keyExtractor={(item) => item.toString()}
        />
      )}
      onEndReached={() => {
        // Load more
      }}
      onEndReachedThreshold={0.5}
    />
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
});

// ============================================================================
// EXAMPLE 2: Search Screen with Results
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, StyleSheet } from 'react-native';
import { Skeleton, EmptyState, ErrorState } from '../StateComponents';

export const SearchScreenExample = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      // Replace with actual search API
      const response = await fetch(
        `https://api.example.com/search?q=${query}`
      );
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    // Loading state
    if (loading) {
      return (
        <View>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={80} style={styles.skeleton} />
          ))}
        </View>
      );
    }

    // Error state
    if (error) {
      return (
        <ErrorState error={error} onRetry={performSearch} />
      );
    }

    // Empty results
    if (query.length > 2 && results.length === 0) {
      return (
        <EmptyState
          icon="search-off"
          title={`No results for "${query}"`}
          message="Try different keywords or remove filters"
          actionLabel="Clear Search"
          onAction={() => setQuery('')}
        />
      );
    }

    // Results list
    if (results.length > 0) {
      return (
        <FlatList
          data={results}
          renderItem={({ item }) => (
            <View style={styles.resultItem}>
              {/* Your result item component */}
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      );
    }

    // Initial empty state (no query)
    return (
      <EmptyState
        icon="search"
        title="Start Searching"
        message="Enter a service name or category to find what you need"
      />
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search services..."
        value={query}
        onChangeText={setQuery}
        placeholderTextColor="#999"
      />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
  },
  skeleton: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  resultItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});

// ============================================================================
// EXAMPLE 3: Bookings List with Pull-to-Refresh
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { LoadingState, EmptyState, ErrorState, SkeletonServiceCard } from '../StateComponents';

export const BookingsListExample = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Replace with actual API call
      const response = await fetch('https://api.example.com/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('https://api.example.com/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  };

  // Full page loading
  if (loading && bookings.length === 0) {
    return <LoadingState message="Loading your bookings..." />;
  }

  // Error on initial load
  if (error && bookings.length === 0) {
    return (
      <ErrorState
        error={error}
        onRetry={loadBookings}
        title="Failed to Load Bookings"
      />
    );
  }

  // Empty bookings
  if (bookings.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="No Bookings Yet"
        message="You haven't made any service bookings"
        actionLabel="Browse Services"
        onAction={() => {
          // Navigate to services
        }}
      />
    );
  }

  // Display bookings with pull-to-refresh and skeleton loading
  return (
    <FlatList
      data={bookings}
      renderItem={({ item }) => (
        <View style={styles.bookingItem}>
          {/* Your booking item component */}
        </View>
      )}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#FF6B35"
        />
      }
      ListHeaderComponent={refreshing && (
        <FlatList
          scrollEnabled={false}
          data={[1]}
          renderItem={() => <SkeletonServiceCard />}
          keyExtractor={(item) => item.toString()}
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  bookingItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
});

// ============================================================================
// EXAMPLE 4: User Profile with Lazy Loading
// ============================================================================

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Skeleton } from '../StateComponents';
import { useTheme } from '../context/ThemeContext';

export const UserProfileExample = () => {
  const [profileLoading, setProfileLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Stagger loading for different sections
    loadProfile();
    setTimeout(() => loadStats(), 300);
    setTimeout(() => loadReviews(), 600);
  }, []);

  const loadProfile = async () => {
    try {
      // Load profile data
      setProfileLoading(false);
    } catch (err) {
      setProfileLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load stats data
      setStatsLoading(false);
    } catch (err) {
      setStatsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      // Load reviews data
      setReviewsLoading(false);
    } catch (err) {
      setReviewsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.section}>
        {profileLoading ? (
          <View style={styles.profileLoader}>
            <Skeleton width={80} height={80} variant="circle" />
            <Skeleton width="70%" height={20} style={{ marginTop: 16 }} />
            <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <View>{/* Actual profile component */}</View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.section}>
        {statsLoading ? (
          <View style={styles.statsLoader}>
            <Skeleton width="100%" height={100} />
            <Skeleton width="100%" height={100} style={{ marginTop: 12 }} />
          </View>
        ) : (
          <View>{/* Actual stats component */}</View>
        )}
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        {reviewsLoading ? (
          <View>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={80} style={{ marginVertical: 8 }} />
            ))}
          </View>
        ) : (
          <View>{/* Actual reviews component */}</View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileLoader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statsLoader: {
    paddingVertical: 20,
  },
});

// ============================================================================
// EXAMPLE 5: Error Boundary Integration
// ============================================================================

import React from 'react';
import { View } from 'react-native';
import { ErrorState } from '../StateComponents';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
          title="Something Went Wrong"
        />
      );
    }

    return this.props.children;
  }
}

// Usage:
// <ErrorBoundary>
//   <YourComponent />
// </ErrorBoundary>

// ============================================================================
// EXPORT
// ============================================================================

export default {
  ServicesListExample,
  SearchScreenExample,
  BookingsListExample,
  UserProfileExample,
  ErrorBoundary,
};
