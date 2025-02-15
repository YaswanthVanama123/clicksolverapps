import React, {useEffect, useState, memo, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';

/* --------------------- ReviewItem Component --------------------- */
const ReviewItem = memo(({item}) =>
  item.comment ? (
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
  ) : null,
);

const formatDate = created_at => {
  const date = new Date(created_at);
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${monthNames[date.getMonth()]} ${String(date.getDate()).padStart(
    2,
    '0',
  )}, ${date.getFullYear()}`;
};

/* --------------------- RatingDistribution Bars --------------------- */
const RatingDistribution = ({label, value}) => (
  <View style={styles.ratingDistributionRow}>
    <Text style={styles.ratingLabel}>{label}</Text>
    <View style={styles.ratingBarContainer}>
      <View style={[styles.ratingValue, {width: `${value}%`}]} />
    </View>
    <Text style={styles.ratingPercentage}>{value}%</Text>
  </View>
);

/* --------------------- Main Screen --------------------- */
const RatingsScreen = () => {
  const [reviews, setReviews] = useState([]);
  const [workerReview, setWorkerReview] = useState({});
  const [ratingDistribution, setRatingDistribution] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  });

  // **Loading state** for ActivityIndicator
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true); // Start loader
      const token = await EncryptedStorage.getItem('pcs_token');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(
        `https://backend.clicksolver.com/api/worker/ratings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // If no data, show "No ratings & reviews"
      if (response.data.length === 0) {
        setReviews([]);
        setWorkerReview({}); // Clear worker review data
      } else {
        setReviews(response.data);
        setWorkerReview(response.data[0]);
        calculateRatingDistribution(response.data);
      }
    } catch (error) {
      console.error('Error fetching reviews data:', error);
    } finally {
      setIsLoading(false); // Stop loader
    }
  }, []);

  const calculateRatingDistribution = reviewsData => {
    const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    reviewsData.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating] += 1;
      }
    });

    const totalReviews = reviewsData.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = totalReviews
        ? Math.round((distribution[key] / totalReviews) * 100)
        : 0;
    });

    setRatingDistribution(distribution);
  };

  // --------------------- Render ---------------------
  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Icon name="arrow-back" size={24} color="#000" style={{marginRight: 10}} />
        <Text style={styles.headerTitle}>Rating Screen</Text>
      </View>

      {/* 1) Show loader if isLoading */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF5722" />
        </View>
      ) : reviews.length === 0 ? (
        // 2) If not loading but no data
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No ratings and reviews</Text>
        </View>
      ) : (
        // 3) Normal UI if we have data
        <ScrollView style={styles.container}>
          {/* Rating Summary & Distribution */}
          <View style={styles.ratingHeadContainer}>
            <View style={styles.ratingDistributionContainer}>
              {Object.keys(ratingDistribution)
                .sort((a, b) => b - a)
                .map(key => (
                  <RatingDistribution
                    key={key}
                    label={key}
                    value={ratingDistribution[key]}
                  />
                ))}
            </View>

            <View style={styles.ratingSummaryContainer}>
              <Text style={styles.overallRating}>
                {workerReview.rating || 0}
              </Text>
              <View style={styles.ratingContainer}>
                {Array.from({length: 5}, (_, i) => (
                  <FontAwesome
                    key={i + 1}
                    name={
                      i < (workerReview.rating || 0) ? 'star' : 'star-o'
                    }
                    size={14}
                    color="#FF5722"
                    style={{marginRight: 3}}
                  />
                ))}
              </View>
              <Text style={styles.reviewCount}>{reviews.length} ratings</Text>
            </View>
          </View>

          {/* Reviews List */}
          <FlatList
            data={reviews.filter(review => review.comment !== null)}
            renderItem={({item}) => <ReviewItem item={item} />}
            keyExtractor={item => uuid.v4()}
            showsVerticalScrollIndicator={false}
          />
        </ScrollView>
      )}
    </View>
  );
};

/* --------------------- Styles --------------------- */
const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
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
    fontSize: 16,
    color: '#999',
  },
  ratingHeadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  ratingSummaryContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
  },
  overallRating: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#212121',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 16,
    color: '#808080',
    textAlign: 'center',
  },
  ratingDistributionContainer: {
    paddingHorizontal: 16,
    width: '70%',
  },
  ratingDistributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  ratingLabel: {
    width: 20,
    fontSize: 16,
    color: '#4a4a4a',
  },
  ratingBarContainer: {
    flex: 1,
    height: 10,
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
    fontSize: 16,
    color: '#4a4a4a',
  },
  reviewContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    color: '#4a4a4a',
    fontWeight: 'bold',
  },
  reviewTime: {
    fontSize: 12,
    color: '#808080',
  },
  reviewText: {
    fontSize: 14,
    color: '#4a4a4a',
    marginTop: 8,
    lineHeight: 20,
  },
  ratingContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default RatingsScreen;
