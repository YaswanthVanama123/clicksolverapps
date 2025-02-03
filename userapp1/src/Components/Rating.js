import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

const Rating = ({navigation}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitFeedback = async () => {
    try {
      const response = await axios.post(
        `${process.env.BACKEND_API}/api/feedback`, // Replace with your backend API URL
        {
          rating: rating,
          comment: comment,
        },
      );
      console.log('Feedback submitted successfully:', response.data);
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
    navigation.goBack(); // Navigate back after submitting
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}>
          <Icon name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>How was the quality of your call?</Text>
        <Text style={styles.modalSubtitle}>
          Your answer is anonymous. This helps us improve our service.
        </Text>

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}>
              <MaterialCommunityIcons
                name={star <= rating ? 'star' : 'star-outline'}
                size={30}
                color={star <= rating ? '#FFD700' : '#A9A9A9'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment Box */}
        <TextInput
          style={styles.commentBox}
          placeholder="Write your comment here..."
          placeholderTextColor="#A9A9A9"
          multiline
          value={comment}
          onChangeText={setComment}
        />

        {/* Submit Button */}
        <TouchableOpacity onPress={submitFeedback} style={styles.submitButton}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  }, 
  container: {
    flex: 1,
    backgroundColor: '#1D2951',
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF4500',
    borderRadius: 15,
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginVertical: 10,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  starButton: {
    marginHorizontal: 5,
  },
  commentBox: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderColor: '#A9A9A9',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    color: '#000000',
    fontSize: 14,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 15,
    backgroundColor: '#FF4500',
    borderRadius: 10,
    width: Dimensions.get('window').width * 0.9,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Rating;
