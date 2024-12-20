import React, {useEffect, useState, memo} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid';

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

// Rating Distribution Bars
const RatingDistribution = ({label, value}) => (
  <View style={styles.ratingDistributionRow}>
    <Text style={styles.ratingLabel}>{label}</Text>
    <View style={styles.ratingBarContainer}>
      <View style={[styles.ratingValue, {width: `${value}%`}]} />
    </View>
    <Text style={styles.ratingPercentage}>{value}%</Text>
  </View>
);

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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = await EncryptedStorage.getItem('pcs_token');
        if (!token) throw new Error('Token not found');

        const response = await axios.get(
          `${process.env.BackendAPI10}/api/worker/ratings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (JSON.stringify(response.data) !== JSON.stringify(reviews)) {
          setReviews(response.data);
          setWorkerReview(response.data[0]);
          calculateRatingDistribution(response.data);
        }
      } catch (error) {
        console.error('Error fetching reviews data:', error);
      }
    };

    const calculateRatingDistribution = reviews => {
      const distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
      reviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          distribution[review.rating] += 1;
        }
      });

      const totalReviews = reviews.length;
      Object.keys(distribution).forEach(key => {
        distribution[key] = totalReviews
          ? Math.round((distribution[key] / totalReviews) * 100)
          : 0;
      });

      setRatingDistribution(distribution);
    };

    fetchReviews();
  }, [reviews]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerContainer}>
        <Icon
          name="arrow-back"
          size={24}
          color="#000"
          style={{marginRight: 10}}
        />
        <Text style={styles.headerTitle}>Rating Screen</Text>
      </View>
      <ScrollView style={styles.container}>
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
            <Text style={styles.overallRating}>{workerReview.rating}</Text>
            <View style={styles.ratingContainer}>
              {Array.from({length: 5}, (_, i) => (
                <FontAwesome
                  key={i + 1}
                  name={i < workerReview.rating ? 'star' : 'star-o'}
                  size={14}
                  color="#FF5722"
                  style={{marginRight: 3}}
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>{reviews.length} ratings</Text>
          </View>
        </View>

        <FlatList
          data={reviews.filter(review => review.comment !== null)}
          renderItem={({item}) => <ReviewItem item={item} />}
          keyExtractor={item => uuid.v4()}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>
    </View>
  );
};

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
