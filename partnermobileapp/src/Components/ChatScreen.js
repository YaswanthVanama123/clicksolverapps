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
} from 'react-native';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ChatScreen = ({ navigation, route }) => {
  const { request_id, senderType, profileImage, profileName } = route.params;
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    console.log('ChatScreen parameters:', { request_id, senderType, profileImage, profileName });
  }, [request_id, senderType, profileImage, profileName]);

  useFocusEffect(
    useCallback(() => {
      console.log('ChatScreen focused. Fetching messages...');
      fetchMessages();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM notification received in the chat box screen:', remoteMessage);
      if (remoteMessage.data && remoteMessage.data.request_id === String(request_id)) {
        console.log('Request id matches. Fetching new messages...');
        fetchMessages();
      }
    });

    return () => unsubscribe();
  }, [request_id]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for request_id:', request_id);
      const response = await axios.get('http:192.168.243.71:5000/api/worker/getMessages', {
        params: { request_id },
      });
      setMessages(response.data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await axios.post('http:192.168.243.71:5000/api/send/message/user', {
        request_id,
        senderType,
        message,
      });
      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Image source={{ uri: profileImage }} style={styles.profileImage} />
        <Text style={styles.headerTitle}>{profileName}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          style={styles.flatList}
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            // Log the message key for debugging purposes
            console.log('Rendering message with key:', item.key);
            // If key is "worker", use userMessage style to display on the right
            const isWorker = item.key.toLowerCase() === 'worker';
            return (
              <View
                style={[
                  styles.messageContainer,
                  isWorker ? styles.userMessage : styles.workerMessage,
                ]}
              >
                <Text style={styles.messageText}>{item.message}</Text>
                <Text style={styles.timestamp}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

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
  // User messages are now on the right side
  userMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  // Non-worker messages will appear on the left side
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
