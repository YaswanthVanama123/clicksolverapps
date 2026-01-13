import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';

const FeedbackModal = ({visible, feedbackId, onClose, isDarkMode, t}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async () => {
    if (rating === 0) {
      return;
    }

    try {
      setSubmitting(true);
      const token = await EncryptedStorage.getItem('cs_token');
      await axios.post(
        'https://backend.clicksolver.com/api/user/feedback',
        {
          rating,
          comment,
          notification_id: feedbackId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      resetAndClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {backgroundColor: isDarkMode ? '#1f1f1f' : '#FFFFFF'},
          ]}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={resetAndClose}>
            <Icon name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Title */}
          <Text
            style={[
              styles.modalTitle,
              {color: isDarkMode ? '#fff' : '#212121'},
            ]}>
            {t('feedback_modal_title') ||
              'How was the quality of your Service?'}
          </Text>

          {/* Subtitle */}
          <Text
            style={[
              styles.modalSubtitle,
              {color: isDarkMode ? '#ccc' : '#9e9e9e'},
            ]}>
            {t('feedback_modal_subtitle') ||
              'Your answer is anonymous. This helps us improve our service.'}
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
                  size={32}
                  color={star <= rating ? '#FFD700' : '#A9A9A9'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Comment Box */}
          <TextInput
            style={[
              styles.commentBox,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#FFFFFF',
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? '#444' : '#D0D0D0',
              },
            ]}
            placeholder={
              t('feedback_placeholder') || 'Write your comment here...'
            }
            placeholderTextColor={isDarkMode ? '#888' : '#A9A9A9'}
            multiline
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={resetAndClose}
              style={[styles.button, styles.notNowButton]}>
              <Text style={styles.notNowText}>
                {t('feedback_not_now') || 'Not now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={submitFeedback}
              disabled={submitting || rating === 0}
              style={[
                styles.button,
                styles.submitButton,
                (submitting || rating === 0) && styles.disabledButton,
              ]}>
              <Text style={styles.submitText}>
                {submitting
                  ? t('submitting') || 'Submitting...'
                  : t('feedback_submit') || 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF4500',
    borderRadius: 20,
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'RobotoSlab-Bold',
    marginTop: 15,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 25,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  commentBox: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    fontFamily: 'RobotoSlab-Regular',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowButton: {
    backgroundColor: '#9E9E9E',
  },
  submitButton: {
    backgroundColor: '#FF4500',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  notNowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'RobotoSlab-SemiBold',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'RobotoSlab-SemiBold',
  },
});

export default FeedbackModal;
