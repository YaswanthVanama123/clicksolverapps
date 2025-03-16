import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  AppState,
} from 'react-native';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

const ChatScreen = ({ navigation, route }) => {
  const { request_id, senderType, profileImage, profileName } = route.params;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const flatListRef = useRef(null);

  // Fetch messages from the backend
  const fetchMessages = useCallback(async () => {
    try {
      console.log(`Fetching messages for request_id: ${request_id}`);
      const response = await axios.get(
        'https://backend.clicksolver.com/api/worker/getMessages',
        { params: { request_id } }
      );
      console.log('Fetched Messages:', response.data.messages);
      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [request_id]);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Fetch messages when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [fetchMessages])
  );

  // Listen for Firebase messages in the foreground
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.data?.request_id === String(request_id)) {
        console.log('New message received in foreground:', remoteMessage);
        fetchMessages();
      }
    });
    return unsubscribeForeground;
  }, [fetchMessages, request_id]);

  // Listen for app state changes so that when app comes to foreground, messages are fetched
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'active') {
        console.log('App moved to foreground. Fetching messages...');
        fetchMessages();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [fetchMessages]);

  // Handle background messages
  useEffect(() => {
    // setBackgroundMessageHandler doesn't return an unsubscribe function.
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      if (remoteMessage.data?.request_id === String(request_id)) {
        console.log('New message received in background:', remoteMessage);
        fetchMessages();
      }
    });
  }, [fetchMessages, request_id]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      console.log('Sending message:', message);
      await axios.post('https://backend.clicksolver.com/api/send/message/worker', {
        request_id,
        senderType,
        message,
      });
      console.log('Message sent successfully.');
      setMessages(prevMessages => [
        ...prevMessages,
        { message, key: senderType, timestamp: Date.now() },
      ]);
      setMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
        <Text style={styles.headerTitle}>{profileName}</Text>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        <FlatList
          ref={flatListRef}
          style={styles.flatList}
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.key === 'worker' ? styles.workerMessage : styles.userMessage,
              ]}
            >
              <Text style={styles.messageText}>{item.message}</Text>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        {/* Input Field & Send Button */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#128C7E',
  },
  header: {
    height: 60,
    backgroundColor: '#128C7E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#e5ddd5',
  },
  flatList: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  workerMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 25,
    color: '#000',
  },
  sendButton: {
    backgroundColor: '#128C7E',
    borderRadius: 25,
    padding: 10,
    marginLeft: 10,
  },
});
