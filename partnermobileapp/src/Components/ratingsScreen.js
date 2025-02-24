import React, {useEffect, useState, memo, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';

/* --------------------- formatDate Helper --------------------- */
const formatDate = (created_at) => {
  const date = new Date(created_at);
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(2,'0')}, ${date.getFullYear()}`;
};

/* --------------------- PartialStarRating Component ---------------------
   Renders up to 5 stars with partial fill for decimals (e.g., 4.6 => 4 full stars + 60% of 5th star).
----------------------------------------------------------------------- */
const PartialStarRating = ({ rating, size = 14, color = '#FF5722' }) => {
  const MAX_STARS = 5;
  const fullStars = Math.floor(rating);         // e.g., 4 for 4.6
  const decimalPart = rating - fullStars;       // e.g., 0.6
  const remaining = MAX_STARS - Math.ceil(rating); // e.g., 0 if rating=4.6

  // Array to hold the rendered stars
  const stars = [];

  // Render full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <FontAwesome key={`full-${i}`} name="star" size={size} color={color} />
    );
  }

  // Render partial star if there's a decimal part
  if (decimalPart > 0) {
    stars.push(
      <View key="partial-star" style={{ position: 'relative', width: size, marginRight: 2 }}>
        {/* Outline star (gray or empty) behind */}
        <FontAwesome name="star-o" size={size} color={color} />
        {/* Filled star portion in front */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${decimalPart * 100}%`,
            overflow: 'hidden',
          }}
        >
          <FontAwesome name="star" size={size} color={color} />
        </View>
      </View>
    );
  }

  // Render empty stars if needed
  for (let i = 0; i < remaining; i++) {
    stars.push(
      <FontAwesome key={`empty-${i}`} name="star-o" size={size} color={color} />
    );
  }

  return (
    <View style={{ flexDirection: 'row', marginRight: 3 }}>
      {stars}
    </View>
  );
};

/* --------------------- ReviewItem Component --------------------- */
const ReviewItem = memo(({item, styles}) => {
  if (!item.comment) return null;

  return (
    <View style={styles.reviewContainer}>
      <View style={styles.userContainer}>
        <Image
          source={{
            uri: 'https://i.postimg.cc/mZnDzdqJ/IMG-20240929-WA0024.jpg',
          }}
          style={styles.userImage}
        />
        <View>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={styles.reviewTime}>{formatDate(item.created_at)}</Text>
        </View>
      </View>

      {/* If your review ratings can be decimals, you can also use <PartialStarRating rating={item.rating} /> */}
      <View style={styles.ratingContainerSmall}>
        {Array.from({length: 5}, (_, i) => (
          <FontAwesome
            key={i + 1}
            name={i < item.rating ? 'star' : 'star-o'}
            size={16}
            color="#FF5700"
            style={{marginRight: 3}}
          />
        ))}
      </View>

      <Text style={styles.reviewText}>{item.comment}</Text>
    </View>
  );
});

/* --------------------- Main Screen --------------------- */
const RatingsScreen = () => {
  const { width } = useWindowDimensions();
  const styles = dynamicStyles(width);

  const [reviews, setReviews] = useState([]);
  const [workerReview, setWorkerReview] = useState({});
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await EncryptedStorage.getItem('pcs_token');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(
        'https://backend.clicksolver.com/api/worker/ratings',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.length === 0) {
        setReviews([]);
        setWorkerReview({});
      } else {
        setReviews(response.data);
        setWorkerReview(response.data[0]);
        calculateRatingDistribution(response.data);
      }
    } catch (error) {
      console.error('Error fetching reviews data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateRatingDistribution = (reviewsData) => {
    const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    reviewsData.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating] += 1;
      }
    });
    const totalReviews = reviewsData.length;
    Object.keys(distribution).forEach((key) => {
      distribution[key] = totalReviews
        ? Math.round((distribution[key] / totalReviews) * 100)
        : 0;
    });
    setRatingDistribution(distribution);
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* -------------- Renders each row of the rating distribution -------------- */
  const RatingDistribution = ({ label, value }) => (
    <View style={styles.ratingDistributionRow}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.ratingBarContainer}>
        <View style={[styles.ratingValue, {width: `${value}%`}]} />
      </View>
      <Text style={styles.ratingPercentage}>{value}%</Text>
    </View>
  );

  /* -------------- Render the header that shows rating distribution and average -------------- */
  const renderHeader = () => {
    return (
      <View>
        {/* Rating Summary & Distribution */}
        <View style={styles.ratingHeadContainer}>
          <View style={styles.ratingDistributionContainer}>
            {Object.keys(ratingDistribution)
              .sort((a, b) => b - a)
              .map((key) => (
                <RatingDistribution
                  key={key}
                  label={key}
                  value={ratingDistribution[key]}
                />
              ))}
          </View>

          <View style={styles.ratingSummaryContainer}>
            <Text style={styles.overallRating}>
              {workerReview.average_rating || 0}
            </Text>
            {/* Partial star rating for average */}
            <PartialStarRating
              rating={workerReview.average_rating || 0}
              size={16}
              color="#FF5722"
            />
            <Text style={styles.reviewCount}>
              {reviews.length} ratings
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Icon name="arrow-back" size={24} color="#000" style={{marginRight: 10}} />
          <Text style={styles.headerTitle}>Rating Screen</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No ratings and reviews</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Icon name="arrow-back" size={24} color="#000" style={{marginRight: 10}} />
        <Text style={styles.headerTitle}>Rating Screen</Text>
      </View>

      {/* Single FlatList with ListHeaderComponent */}
      <FlatList
        style={styles.container}
        data={reviews}
        keyExtractor={() => uuid.v4()}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => <ReviewItem item={item} styles={styles} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

/* --------------------- Dynamic Styles Generator --------------------- */
function dynamicStyles(width) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
      // You can add padding if needed:
      // paddingHorizontal: isTablet ? 24 : 16,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? 20 : 16,
      backgroundColor: '#ffffff',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    headerTitle: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: 'bold',
      color: '#000',
      textAlign: 'center',
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noDataText: {
      fontSize: isTablet ? 18 : 16,
      color: '#999',
    },
    ratingHeadContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: isTablet ? 30 : 20,
      paddingHorizontal: isTablet ? 24 : 16,
    },
    ratingDistributionContainer: {
      width: isTablet ? '65%' : '70%',
    },
    ratingDistributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: isTablet ? 4 : 2,
    },
    ratingLabel: {
      width: isTablet ? 30 : 20,
      fontSize: isTablet ? 18 : 16,
      color: '#4a4a4a',
    },
    ratingBarContainer: {
      flex: 1,
      height: isTablet ? 12 : 10,
      backgroundColor: '#e0e0e0',
      borderRadius: 5,
      overflow: 'hidden',
      marginHorizontal: 10,
    },
    ratingValue: {
      height: '100%',
      backgroundColor: '#ff5722',
    },
    ratingPercentage: {
      fontSize: isTablet ? 18 : 16,
      color: '#4a4a4a',
    },
    ratingSummaryContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: isTablet ? '35%' : '30%',
    },
    overallRating: {
      fontSize: isTablet ? 40 : 35,
      fontWeight: 'bold',
      color: '#212121',
    },
    reviewCount: {
      fontSize: isTablet ? 18 : 16,
      color: '#808080',
      textAlign: 'center',
      marginTop: 4,
    },
    reviewContainer: {
      paddingVertical: isTablet ? 20 : 16,
      paddingHorizontal: isTablet ? 24 : 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    userContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isTablet ? 8 : 4,
    },
    userImage: {
      width: isTablet ? 50 : 40,
      height: isTablet ? 50 : 40,
      borderRadius: isTablet ? 25 : 20,
      marginRight: isTablet ? 16 : 12,
    },
    userName: {
      fontSize: isTablet ? 18 : 16,
      color: '#4a4a4a',
      fontWeight: 'bold',
    },
    reviewTime: {
      fontSize: isTablet ? 14 : 12,
      color: '#808080',
    },
    ratingContainerSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    reviewText: {
      fontSize: isTablet ? 16 : 14,
      color: '#4a4a4a',
      marginTop: isTablet ? 12 : 8,
      lineHeight: isTablet ? 24 : 20,
    },
  });
}

export default RatingsScreen;
