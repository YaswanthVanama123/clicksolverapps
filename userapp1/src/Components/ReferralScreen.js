import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  ScrollView,
  Clipboard,
  Share,
  Linking,
  PermissionsAndroid,
  Platform,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import Contacts from 'react-native-contacts';
import { useNavigation } from '@react-navigation/native';
// Import theme hook for dark mode support
import { useTheme } from '../context/ThemeContext';

const ReferralScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState(null);
  const [referralLink, setReferralLink] = useState(null);

  const { width, height } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const token = await EncryptedStorage.getItem('cs_token');
        if (!token) {
          console.error('No token found in storage.');
          return;
        }
        const response = await axios.get(
          'https://backend.clicksolver.com/api/user/referrals',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data.length > 0) {
          // We assume the first item has the referral code
          const data = response.data[0];
          const code = data.referralcode;
          setReferralCode(code);
          // Construct a sample link with query param
          setReferralLink(
            `https://play.google.com/store/apps/details?id=com.userapp1`
          );
          // Transform referral data
          const transformedData = response.data
            .filter(item => item.name) // Only include items that have a "name"
            .map((item, index) => ({
              id: index,
              name: item.name,
              status: item.status_completed ? 'Completed' : 'Pending',
            }));
          setReferrals(transformedData);
        } else {
          setReferrals([]);
        }
      } catch (error) {
        console.log('Error fetching referrals:', error);
      }
    };

    fetchReferrals();
  }, []);

  // ------------------ COPY & SHARE HELPERS ------------------
  const copyCodeToClipboard = () => {
    if (referralCode) Clipboard.setString(referralCode);
  };

  const copyLinkToClipboard = () => {
    if (referralLink) Clipboard.setString(referralLink);
  };

  const shareReferralCode = async () => {
    try {
      const result = await Share.share({
        message: `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`,
      });
      if (result.action === Share.sharedAction && result.activityType) {
        console.log('Shared with activity type:', result.activityType);
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          console.log('WhatsApp is not installed or not supported on this device.');
        }
      })
      .catch(err => console.error('Error opening WhatsApp:', err));
  };

  const inviteViaSMS = phoneNumber => {
    if (!phoneNumber) return;
    const smsMessage = `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`;
    const url = `sms:${phoneNumber}?body=${encodeURIComponent(smsMessage)}`;
    Linking.openURL(url).catch(err => {
      console.error('Error launching SMS app:', err);
    });
  };

  // ------------------ CONTACTS PERMISSION & FETCH ------------------
  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Access Permission',
          message: 'We need access to your contacts to let you invite friends.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS or other platforms
    return true;
  };

  const fetchContacts = async () => {
    try {
      const permission = await requestContactsPermission();
      if (!permission) return;
      const contactsList = await Contacts.getAll();
      setContacts(contactsList);
      setShowContacts(true);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  // ------------------ RENDER HELPERS ------------------
  const renderReferralItem = ({ item }) => (
    <View style={styles.referralItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.referralDetails}>
        <Text style={styles.referralName}>{item.name}</Text>
        <Text
          style={[
            styles.referralStatus,
            item.status === 'Pending'
              ? styles.statusPending
              : styles.statusCompleted,
          ]}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );

  const renderContactItem = ({ item }) => {
    const phoneNumber =
      item.phoneNumbers && item.phoneNumbers.length > 0
        ? item.phoneNumbers[0].number.replace(/\s+/g, '')
        : null;
    return (
      <View style={styles.contactItem}>
        <View style={styles.contactAvatar}>
          <Text style={styles.contactInitials}>
            {item.displayName ? item.displayName[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{item.displayName}</Text>
          {phoneNumber && <Text style={styles.contactNumber}>{phoneNumber}</Text>}
        </View>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => inviteViaSMS(phoneNumber)}
        >
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ------------------ MAIN RENDER ------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : "#212121"} />
          </TouchableOpacity>
          <Text style={styles.mainTitle}>Refer Friends</Text>
          <Text style={styles.subTitle}>Invite your friends</Text>
          <Text style={styles.subDescription}>
            ...to the cool new way of managing money!
          </Text>
        </View>

        {/* Orange Card - "How It Works" */}
        <View style={styles.orangeCard}>
          <View style={styles.cardRow}>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.cardRowText}>
              Share your referral link or code with a friend.
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.cardRowText}>
              Your friend joins using your link or code.
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="gift-outline" size={20} color="#fff" />
            <Text style={styles.cardRowText}>
              Both you and your friend enjoy amazing benefits.
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, !showContacts && styles.activeTab]}
            onPress={() => setShowContacts(false)}
          >
            <Text style={styles.tabText}>Your Referrals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, showContacts && styles.activeTab]}
            onPress={fetchContacts}
          >
            <Text style={styles.tabText}>Invite Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* List Section */}
        <View style={styles.listContainer}>
          {!showContacts ? (
            referrals.length > 0 ? (
              <FlatList
                data={referrals}
                keyExtractor={item => item.id.toString()}
                renderItem={renderReferralItem}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <Text style={styles.noDataText}>No referrals yet.</Text>
            )
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={item => item.recordID}
              renderItem={renderContactItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>

        {/* Referral Code + Copy Section */}
        <View style={styles.referralCodeContainer}>
          <Text style={styles.referralLabel}>Your Code:</Text>
          <TouchableOpacity
            style={styles.referralCodeBox}
            onPress={copyCodeToClipboard}
          >
            <Text style={styles.referralCodeText}>
              {referralCode || 'N/A'}
            </Text>
            <Ionicons
              name="copy-outline"
              size={18}
              color="#fff"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareButtonsContainer}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareViaWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={copyLinkToClipboard}
          >
            <Ionicons name="link-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareReferralCode}
          >
            <Ionicons name="share-social-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const dynamicStyles = (width, height, isDarkMode) => {
  const isTablet = width >= 600;
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
    },
    /* Header Section */
    headerSection: {
      alignItems: 'center',
      paddingTop: 10,
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    backButton: {
      position: 'absolute',
      left: 20,
      top: 10,
      padding: 5,
    },
    mainTitle: {
      marginTop: 40,
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#fff' : '#212121',
    },
    subTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#ccc' : '#212121',
      marginTop: 5,
    },
    subDescription: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#757575',
      marginTop: 5,
      textAlign: 'center',
    },
    /* Orange Card */
    orangeCard: {
      backgroundColor: '#FF7043',
      marginHorizontal: 20,
      borderRadius: 10,
      padding: 16,
      marginTop: 20,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardRowText: {
      marginLeft: 8,
      fontSize: 14,
      color: '#fff',
      lineHeight: 20,
    },
    /* Tab Switcher */
    tabContainer: {
      flexDirection: 'row',
      marginTop: 20,
      marginHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#E0E0E0',
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 3,
      borderBottomColor: '#FF7043',
    },
    tabText: {
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#333',
    },
    /* List Section */
    listContainer: {
      flex: 1,
      marginTop: 10,
      marginHorizontal: 20,
    },
    noDataText: {
      textAlign: 'center',
      marginTop: 30,
      fontSize: 16,
      color: isDarkMode ? '#ccc' : '#9E9E9E',
    },
    /* Referral Item */
    referralItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      backgroundColor: isDarkMode ? '#1e1e1e' : '#FAFAFA',
      borderRadius: 8,
      padding: 10,
      elevation: 1,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FF7043',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    avatarText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    referralDetails: {
      flex: 1,
    },
    referralName: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#212121',
    },
    referralStatus: {
      fontSize: 14,
      marginTop: 2,
    },
    statusPending: {
      color: '#FB8C00',
    },
    statusCompleted: {
      color: '#388E3C',
    },
    /* Contact Item */
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#1e1e1e' : '#FAFAFA',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      elevation: 1,
    },
    contactAvatar: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      backgroundColor: '#FF7043',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    contactInitials: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    contactDetails: {
      flex: 1,
    },
    contactName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#212121',
    },
    contactNumber: {
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#757575',
      marginTop: 2,
    },
    inviteButton: {
      backgroundColor: '#FF7043',
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 6,
    },
    inviteButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    /* Referral Code + Copy Section */
    referralCodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginBottom: 16,
      justifyContent: 'space-between',
    },
    referralLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#212121',
    },
    referralCodeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF7043',
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    referralCodeText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: 'bold',
    },
    /* Share Buttons */
    shareButtonsContainer: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginBottom: 20,
      justifyContent: 'space-between',
    },
    shareButton: {
      backgroundColor: '#FF7043',
      padding: 14,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginHorizontal: 5,
    },
  });
};

export default ReferralScreen;
