import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {
  useNavigation,
  useRoute,
  CommonActions,
  useFocusEffect,
} from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Rating = () => {
  const [rating, setRating] = useState(null); // Set to null initially to show all emojis
  const [comments, setComments] = useState('');
  const [decodedId, setDecodedId] = useState(null);
  const [selectedRatingType, setSelectedRatingType] = useState('worker');
  const route = useRoute();
  const navigation = useNavigation();
  const encodedId = 'MTQxNg==';
  const [emojiAnimations, setEmojiAnimations] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);

  const emojis = ['😢', '☹️', '🙂', '😃', '😍'];
  const emojiLabels = ['Terrible', 'Bad', 'Neutral', 'Good', 'Loved It'];

  useEffect(() => {
    if (encodedId) {
      const decoded = atob(encodedId);
      setDecodedId(decoded);
    }
  }, [encodedId]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
          }),
        );
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  const handleEmojiPress = index => {
    setRating(index); // Set the selected emoji index
    Animated.sequence([
      Animated.timing(emojiAnimations[index], {
        toValue: 1.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(emojiAnimations[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    try {
      const data = {
        notification_id: decodedId,
        rating: rating + 1, // Rating starts from 1
        comments,
        ratingFor: selectedRatingType === 'worker' ? 'Worker' : 'App',
      };
      const response = await axios.post(
        `${process.env.BACKENDAIPE}/api/user/feedback`,
        data,
      );
      Alert.alert('Feedback submitted:', response.data.message);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Tabs', state: {routes: [{name: 'Home'}]}}],
        }),
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback.');
    }
  };

  const toggleRatingType = type => {
    setSelectedRatingType(type);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Give Feedback</Text>
        {/* <Text style={styles.ratingLabel}>Rate your experience</Text> */}
        {/* <Text style={styles.experienceText}>How was experience with our Commander</Text> */}
        {/* <View style={styles.profileContainer}>
          <View>
            <Image source={{uri: "https://i.postimg.cc/mZnDzdqJ/IMG-20240929-WA0024.jpg"}} style={styles.profileImage}/>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.workerName}>Yaswanth</Text>
            <Text style={styles.profession}>Electrician</Text>
          </View>
        </View> */}
        <View>
          <Text style={styles.commanderName}>Commander</Text>
          <TextInput
            style={[styles.Commanderinput]}
            placeholder="Comment, if any?"
            placeholderTextColor="#aaa"
            value="Yaswanth"
            onChangeText={setComments}
            editable={false}
          />
        </View>
        {/* Display the selected emoji above, if any */}
        {rating !== null && (
          <View style={styles.selectedEmojiContainer}>
            <Animated.Text
              style={[
                styles.selectedEmoji,
                {transform: [{scale: emojiAnimations[rating]}]},
              ]}>
              {emojis[rating]}
            </Animated.Text>
            <Text style={[styles.emojiLabel, styles.glowText]}>
              {emojiLabels[rating]}
            </Text>
          </View>
        )}

        {/* Display all emojis in a row */}
        <View style={styles.emojisContainer}>
          {emojis.map((emoji, index) => (
            <View key={index} style={styles.emojiContainer}>
              <TouchableOpacity onPress={() => handleEmojiPress(index)}>
                <Animated.Text
                  style={[
                    styles.emoji,
                    {
                      opacity: rating === index ? 1 : 0.5,
                      transform: [{scale: emojiAnimations[index]}],
                    },
                  ]}>
                  {emoji}
                </Animated.Text>
              </TouchableOpacity>
              <Text style={styles.emojiLabel}>{emojiLabels[index]}</Text>
            </View>
          ))}
        </View>

        {/* Rating type selector and comments input */}
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => toggleRatingType('worker')}>
            <Icon
              name={
                selectedRatingType === 'worker'
                  ? 'radio-button-checked'
                  : 'radio-button-unchecked'
              }
              size={20}
              color={selectedRatingType === 'app' ? '#4a4a4a' : '#ff4500'}
            />
            <Text style={styles.radioLabel}>Rating for Worker</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioRow}
            onPress={() => toggleRatingType('app')}>
            <Icon
              name={
                selectedRatingType === 'app'
                  ? 'radio-button-checked'
                  : 'radio-button-unchecked'
              }
              size={20}
              color={selectedRatingType === 'app' ? '#ff4500' : '#4a4a4a'}
            />
            <Text style={styles.radioLabel}>Rating for App</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          numberOfLines={4}
          placeholder="Comment, if any?"
          placeholderTextColor="#aaa"
          value={comments}
          onChangeText={setComments}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>PUBLISH FEEDBACK</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginBottom: 20,
  },
  commanderName: {
    color: '#9e9e9e',
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: 'bold',
  },
  experienceText: {
    color: '#4a4a4a',
    textAlign: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,
    marginVertical: 15,
    marginBottom: 20,
  },
  detailsContainer: {
    flexDirection: 'column',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profession: {
    color: '#4a4a4a',
    fontSize: 14,
  },
  workerName: {
    color: '#9e9e9e',
    fontWeight: 'bold',
    fontSize: 17,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 25,
    color: '#000',
    textAlign: 'center',
  },
  emojisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  selectedEmojiContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emojiContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  selectedEmoji: {
    fontSize: 60,
  },
  emojiLabel: {
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
  },
  glowText: {
    color: '#212121',
    fontWeight: 'bold',
  },
  radioContainer: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 30,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
  },
  Commanderinput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 5,
    marginBottom: 20,
    fontSize: 16,
    color: '#9e9e9e',
    paddingLeft: 15,
  },
  submitButton: {
    backgroundColor: '#ff4500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Rating;
