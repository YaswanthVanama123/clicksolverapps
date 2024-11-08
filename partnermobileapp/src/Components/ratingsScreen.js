import React, { useEffect, useState, memo } from 'react';
import { View, Text, Image, FlatList, StyleSheet, Dimensions, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import SimpleLineIcons from 'react-native-vector-icons/Feather';
import EncryptedStorage from 'react-native-encrypted-storage';
import axios from 'axios';
import uuid from 'react-native-uuid'; 

// Memoized ReviewItem component to prevent unnecessary re-renders
const ReviewItem = memo(({ item }) => (
  <View style={styles.reviewContainer}>
    <View style={styles.userContainer}>
      <Image source={{ uri: item.profileImage }} style={styles.userImage} />
      <View>
        <Text style={styles.userName}>{item.username}</Text>
        <View style={styles.ratingContainer}>
          {Array.from({ length: 5 }, (_, i) => (
            <FontAwesome
              key={i + 1}
              name={i < item.rating ? 'star' : 'star-o'}
              size={16}
              color="#FF5722"
              style={{ marginRight: 3 }}
            />
          ))}
        </View>
      </View>
    </View>
    <Text style={styles.reviewText}>{item.comment}</Text>
  </View>
));

// Rating Distribution Bars
const RatingDistribution = ({ label, value, color }) => (
  <View style={styles.ratingDistributionRow}>
    <Text style={styles.ratingLabel}>{label}</Text>
    <View style={styles.ratingBar}>
      <View style={[styles.ratingValue, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const RatingsScreen = () => {
  const [reviews, setReviews] = useState([]);
  const [workerReview, setWorkerReview] = useState({});

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = await EncryptedStorage.getItem('pcs_token');
        if (!token) throw new Error("Token not found");

        const response = await axios.get(`${process.env.BackendAPI6}/api/worker/ratings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (JSON.stringify(response.data) !== JSON.stringify(reviews)) {
          setReviews(response.data);
          setWorkerReview(response.data[0]);
        }

        console.log(response.data);
      } catch (error) {
        console.error('Error fetching reviews data:', error);
      }
    };

    fetchReviews();
  }, [reviews]);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
      <FontAwesome6 name='arrow-left-long' size={22} color='#9e9e9e' style={styles.leftIcon} />
      <Text style={styles.screenName}>Ratings & reviews</Text>
    </View>
      <ScrollView style={styles.container}>
        <View style={styles.overallRatingContainer}>
          <Text style={styles.overallRating}>{workerReview.rating}</Text>
          <View style={styles.ratingContainer}>
            {Array.from({ length: 5 }, (_, i) => (
              <FontAwesome
                key={i + 1}
                name={i < workerReview.rating ? 'star' : 'star-o'}
                size={22}
                color="#FF5722"
                style={{ marginRight: 3 }}
              />
            ))}
          </View>
          <Text style={styles.reviewCount}>based on {reviews.length} reviews</Text>
        </View>

        <View style={styles.ratingDistributionContainer}>
          <RatingDistribution label="Excellent" value={60} color="#4CAF50" />
          <RatingDistribution label="Good" value={25} color="#8BC34A" />
          <RatingDistribution label="Average" value={10} color="#FFC107" />
          <RatingDistribution label="Below Average" value={3} color="#FF9800" />
          <RatingDistribution label="Poor" value={2} color="#F44336" />
        </View>

        <FlatList
          data={reviews}
          renderItem={({ item }) => <ReviewItem item={item} />}
          keyExtractor={(item) => uuid.v4() }
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  mainContainer:{
    flex:1,
    backgroundColor:'#FFFFFF'
  },
  container: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,

    position: 'relative',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: '#ffffff',
  },
  leftIcon: {
    position: 'absolute',
    left: 10,
  },
  screenName: {
    color: '#747476',
    fontSize: 20,
    fontWeight: 'bold',
  },
  overallRatingContainer: {
    paddingHorizontal:16,
    alignItems: 'center',
    marginBottom: 20,
  },
  overallRating: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4a4a4a',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  reviewCount: {
    fontSize: 16,
    color: '#808080',
    marginTop: 8,
  },
  ratingDistributionContainer: {
    marginBottom: 20,
    paddingHorizontal:16
  },
  ratingDistributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  ratingLabel: {
    width: 110,
    fontSize: 14,
    color: '#4a4a4a',
  },
  ratingBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  ratingValue: {
    height: '100%',
  },
  reviewContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    color: '#4a4a4a',
    fontWeight: 'bold',
  },
  reviewText: {
    fontSize: 14,
    color: '#808080',
    marginTop: 8,
  },
});

export default RatingsScreen;
