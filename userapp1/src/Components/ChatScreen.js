/**
 * ChatScreen Component
 * Real-time chat interface between user and worker with Firebase messaging integration
 * Features: Live message updates, Firebase notifications, scroll-to-bottom, typing indicator
 */

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
  useWindowDimensions,
} from 'react-native';
import axios from 'axios';
import messaging from '@react-native-firebase/messaging';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../theme/colors';
import { formatTime } from '../utils/formatters';
import LoadingState from './molecules/LoadingState';
import ErrorState from './molecules/ErrorState';
import EmptyState from './molecules/EmptyState';

/**
 * ChatScreen - Real-time messaging interface
 * @param {object} props - Component props
 * @param {object} props.navigation - Navigation object
 * @param {object} props.route - Route params containing request_id, senderType, profileImage, profileName
 */
const ChatScreen = ({ navigation, route }) => {
  const { request_id, senderType, profileImage, profileName } = route.params;
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const colors = getColors(isDarkMode);

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef(null);
  const styles = dynamicStyles(width, isDarkMode, colors);

  /**
   * Fetches messages from the backend
   * @returns {Promise<void>}
   */
  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(
        'https://backend.clicksolver.com/api/worker/getMessages',
        {
          params: { request_id },
          timeout: 10000,
        }
      );

      if (response.data && Array.isArray(response.data.messages)) {
        setMessages(response.data.messages);
        scrollToBottom();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('[ChatScreen] Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [request_id]);

  /**
   * Scrolls the message list to the bottom
   */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  // Fetch messages when screen is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMessages();
    }, [fetchMessages])
  );

  // Listen for Firebase messages in the foreground
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.data?.request_id === String(request_id)) {
        fetchMessages();
      }
    });
    return unsubscribeForeground;
  }, [fetchMessages, request_id]);

  // Listen for app state changes to refresh messages
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'active') {
        fetchMessages();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [fetchMessages]);

  // Handle background messages
  useEffect(() => {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      if (remoteMessage.data?.request_id === String(request_id)) {
        fetchMessages();
      }
    });
  }, [fetchMessages, request_id]);

  /**
   * Sends a message to the backend
   * @returns {Promise<void>}
   */
  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending) return;

    try {
      setSending(true);
      setError(null);

      await axios.post(
        'https://backend.clicksolver.com/api/send/message/worker',
        {
          request_id,
          senderType,
          message: trimmedMessage,
        },
        { timeout: 10000 }
      );

      // Optimistically add message to UI
      const newMessage = {
        message: trimmedMessage,
        key: senderType,
        timestamp: Date.now()
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('[ChatScreen] Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  /**
   * Renders individual message item
   * @param {object} item - Message object
   * @returns {JSX.Element}
   */
  const renderMessage = ({ item }) => {
    const isWorkerMessage = item.key === 'worker';
    const messageTime = formatTime(item.timestamp);

    return (
      <View
        style={[
          styles.messageContainer,
          isWorkerMessage ? styles.workerMessage : styles.userMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.timestamp}>{messageTime}</Text>
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return <LoadingState message="Loading chat..." />;
  }

  // Show error state
  if (error && messages.length === 0) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          setLoading(true);
          fetchMessages();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        {profileImage && (
          <Image
            source={{ uri: profileImage }}
            style={styles.profileImage}
          />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profileName || 'Chat'}
        </Text>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        {messages.length === 0 ? (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="No Messages Yet"
            message="Start the conversation by sending a message"
          />
        ) : (
          <FlatList
            ref={flatListRef}
            style={styles.flatList}
            data={messages}
            keyExtractor={(item, index) => `${item.timestamp}_${index}`}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="error-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Input Field & Send Button */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled
            ]}
            disabled={!message.trim() || sending}
          >
            <Icon
              name={sending ? "hourglass-empty" : "send"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles based on theme and screen size
 * @param {number} width - Screen width
 * @param {boolean} isDarkMode - Theme mode
 * @param {object} colors - Color palette
 * @returns {object} StyleSheet object
 */
const dynamicStyles = (width, isDarkMode, colors) => {
  const isTablet = width >= 600;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#128C7E',
    },
    header: {
      height: isTablet ? 70 : 60,
      backgroundColor: '#128C7E',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 20 : 15,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    profileImage: {
      width: isTablet ? 45 : 40,
      height: isTablet ? 45 : 40,
      borderRadius: isTablet ? 22.5 : 20,
      marginLeft: isTablet ? 15 : 10,
      borderWidth: 2,
      borderColor: '#fff',
    },
    headerTitle: {
      color: '#fff',
      fontSize: isTablet ? 22 : 20,
      fontWeight: 'bold',
      marginLeft: isTablet ? 15 : 10,
      flex: 1,
      fontFamily: 'RobotoSlab-Medium',
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
      padding: isTablet ? 15 : 10,
    },
    messageContainer: {
      maxWidth: '80%',
      padding: isTablet ? 12 : 10,
      borderRadius: 10,
      marginBottom: isTablet ? 12 : 10,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    userMessage: {
      backgroundColor: '#dcf8c6',
      alignSelf: 'flex-end',
      borderBottomRightRadius: 2,
    },
    workerMessage: {
      backgroundColor: '#fff',
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 2,
    },
    messageText: {
      fontSize: isTablet ? 17 : 16,
      color: '#000',
      fontFamily: 'RobotoSlab-Regular',
      lineHeight: isTablet ? 24 : 22,
    },
    timestamp: {
      fontSize: isTablet ? 12 : 11,
      color: '#666',
      marginTop: 5,
      textAlign: 'right',
      fontFamily: 'RobotoSlab-Regular',
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEE2E2',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      color: '#EF4444',
      fontFamily: 'RobotoSlab-Regular',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: '#fff',
      paddingVertical: isTablet ? 12 : 10,
      paddingHorizontal: isTablet ? 18 : 15,
      borderTopWidth: 1,
      borderColor: '#ddd',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    input: {
      flex: 1,
      fontSize: isTablet ? 17 : 16,
      padding: isTablet ? 12 : 10,
      backgroundColor: '#f2f2f2',
      borderRadius: 25,
      color: '#000',
      maxHeight: 100,
      fontFamily: 'RobotoSlab-Regular',
    },
    sendButton: {
      backgroundColor: '#128C7E',
      borderRadius: 25,
      padding: isTablet ? 12 : 10,
      marginLeft: isTablet ? 12 : 10,
      elevation: 2,
      shadowColor: '#128C7E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
    },
    sendButtonDisabled: {
      backgroundColor: '#a0a0a0',
      opacity: 0.6,
    },
  });
};

export default ChatScreen;
