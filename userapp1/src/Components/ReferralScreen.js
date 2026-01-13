/**
 * ReferralScreen Component
 * Displays user referrals and provides sharing capabilities
 * Features: referral code display, contact invitation, WhatsApp sharing, and referral tracking
 *
 * @module ReferralScreen
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  ScrollView,
  Clipboard,
  Share,
  Linking,
  PermissionsAndroid,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Contacts from 'react-native-contacts';
import {useNavigation} from '@react-navigation/native';

// Theme and utilities
import {useTheme} from '../context/ThemeContext';
import {useTranslation} from 'react-i18next';

// State components
import LoadingState from '../Components/molecules/LoadingState';
import ErrorState from '../Components/molecules/ErrorState';
import EmptyState from '../Components/molecules/EmptyState';

// API services
import {getUserReferrals} from '../api/services/user.service';

// Validators and formatters
import {formatPhoneNumber, capitalize} from '../utils/formatters';

/**
 * ReferralScreen Component
 * @returns {JSX.Element} Referral screen with sharing options
 */
const ReferralScreen = () => {
  // State
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState(null);
  const [referralLink, setReferralLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hooks
  const {width, height} = useWindowDimensions();
  const {isDarkMode} = useTheme();
  const styles = dynamicStyles(width, height, isDarkMode);
  const navigation = useNavigation();
  const {t} = useTranslation();

  /**
   * Fetch user referrals from API
   * @async
   */
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use API service
        const data = await getUserReferrals();

        if (data.length > 0) {
          // Extract referral code from first item
          const code = data[0].referralcode;
          setReferralCode(code);

          // Construct app link with referral code
          setReferralLink(
            `https://play.google.com/store/apps/details?id=com.userapp1&referral=${code}`
          );

          // Transform referral data
          const transformedData = data
            .filter(item => item.name) // Only include items with names
            .map((item, index) => ({
              id: index,
              name: item.name,
              status: item.status_completed
                ? t('completed') || 'Completed'
                : t('pending') || 'Pending',
            }));

          setReferrals(transformedData);
        } else {
          setReferrals([]);
        }
      } catch (err) {
        console.error('Error fetching referrals:', err);
        setError(err.message || 'Failed to load referrals');
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [t]);

  /**
   * Copy referral code to clipboard
   */
  const copyCodeToClipboard = () => {
    if (referralCode) {
      Clipboard.setString(referralCode);
      Alert.alert(
        t('success') || 'Success',
        t('code_copied') || 'Referral code copied to clipboard!'
      );
    }
  };

  /**
   * Copy referral link to clipboard
   */
  const copyLinkToClipboard = () => {
    if (referralLink) {
      Clipboard.setString(referralLink);
      Alert.alert(
        t('success') || 'Success',
        t('link_copied') || 'Referral link copied to clipboard!'
      );
    }
  };

  /**
   * Share referral code via native share dialog
   * @async
   */
  const shareReferralCode = async () => {
    try {
      const message =
        t('share_message', {referralCode, referralLink}) ||
        `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`;

      const result = await Share.share({message});

      if (result.action === Share.sharedAction && result.activityType) {
        console.log('Shared with activity type:', result.activityType);
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error.message);
      Alert.alert(
        t('error') || 'Error',
        t('share_failed') || 'Failed to share referral code'
      );
    }
  };

  /**
   * Share via WhatsApp
   */
  const shareViaWhatsApp = () => {
    const message =
      t('share_message', {referralCode, referralLink}) ||
      `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          Alert.alert(
            t('error') || 'Error',
            t('whatsapp_not_installed') ||
              'WhatsApp is not installed or not supported on this device.'
          );
        }
      })
      .catch(err => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert(
          t('error') || 'Error',
          t('whatsapp_error') || 'Failed to open WhatsApp'
        );
      });
  };

  /**
   * Invite contact via SMS
   * @param {string} phoneNumber - Phone number to invite
   */
  const inviteViaSMS = phoneNumber => {
    if (!phoneNumber) return;

    const smsMessage =
      t('share_message', {referralCode, referralLink}) ||
      `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`;

    const url = `sms:${phoneNumber}?body=${encodeURIComponent(smsMessage)}`;

    Linking.openURL(url).catch(err => {
      console.error('Error launching SMS app:', err);
      Alert.alert(
        t('error') || 'Error',
        t('sms_error') || 'Failed to open SMS app'
      );
    });
  };

  /**
   * Request contacts permission
   * @async
   * @returns {boolean} - Whether permission was granted
   */
  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title:
            t('contacts_permission_title') || 'Contacts Access Permission',
          message:
            t('contacts_permission_message') ||
            'We need access to your contacts to let you invite friends.',
          buttonNeutral: t('ask_me_later') || 'Ask Me Later',
          buttonNegative: t('cancel') || 'Cancel',
          buttonPositive: t('ok') || 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS or other platforms
    return true;
  };

  /**
   * Fetch device contacts
   * @async
   */
  const fetchContacts = async () => {
    try {
      const permission = await requestContactsPermission();
      if (!permission) {
        Alert.alert(
          t('permission_denied') || 'Permission Denied',
          t('contacts_permission_required') ||
            'Contacts access is required to invite friends.'
        );
        return;
      }

      const contactsList = await Contacts.getAll();
      setContacts(contactsList);
      setShowContacts(true);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Alert.alert(
        t('error') || 'Error',
        t('contacts_error') || 'Failed to fetch contacts'
      );
    }
  };

  /**
   * Render single referral item
   * @param {object} item - Referral item data
   * @returns {JSX.Element} Referral item component
   */
  const renderReferralItem = ({item}) => (
    <View style={styles.referralItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.referralDetails}>
        <Text style={styles.referralName}>{capitalize(item.name)}</Text>
        <Text
          style={[
            styles.referralStatus,
            item.status === (t('pending') || 'Pending')
              ? styles.statusPending
              : styles.statusCompleted,
          ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  /**
   * Render single contact item
   * @param {object} item - Contact item data
   * @returns {JSX.Element} Contact item component
   */
  const renderContactItem = ({item}) => {
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
          {phoneNumber && (
            <Text style={styles.contactNumber}>
              {formatPhoneNumber(phoneNumber)}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => inviteViaSMS(phoneNumber)}>
          <Text style={styles.inviteButtonText}>
            {t('invite') || 'Invite'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState
          message={t('loading_referrals') || 'Loading referrals...'}
        />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? '#fff' : '#212121'}
            />
          </TouchableOpacity>
          <Text style={styles.mainTitle}>
            {t('refer_friends') || 'Refer Friends'}
          </Text>
          <Text style={styles.subTitle}>
            {t('invite_your_friends') || 'Invite your friends'}
          </Text>
          <Text style={styles.subDescription}>
            {t('sub_description') ||
              '...to the cool new way of managing services!'}
          </Text>
        </View>

        {/* How It Works Card */}
        <View style={styles.orangeCard}>
          <View style={styles.cardRow}>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.cardRowText}>
              {t('share_referral_link') ||
                'Share your referral link or code with a friend.'}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.cardRowText}>
              {t('friend_joins') ||
                'Your friend joins using your link or code.'}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Ionicons name="gift-outline" size={20} color="#fff" />
            <Text style={styles.cardRowText}>
              {t('enjoy_benefits') ||
                'Both you and your friend enjoy amazing benefits.'}
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, !showContacts && styles.activeTab]}
            onPress={() => setShowContacts(false)}>
            <Text style={styles.tabText}>
              {t('your_referrals') || 'Your Referrals'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, showContacts && styles.activeTab]}
            onPress={fetchContacts}>
            <Text style={styles.tabText}>
              {t('invite_contacts') || 'Invite Contacts'}
            </Text>
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
                contentContainerStyle={{paddingBottom: 20}}
              />
            ) : (
              <EmptyState
                icon="people-outline"
                title={t('no_referrals') || 'No Referrals Yet'}
                message={
                  t('no_referrals_message') ||
                  'Start inviting your friends to earn rewards!'
                }
              />
            )
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={item => item.recordID}
              renderItem={renderContactItem}
              contentContainerStyle={{paddingBottom: 20}}
            />
          )}
        </View>

        {/* Referral Code + Copy Section */}
        <View style={styles.referralCodeContainer}>
          <Text style={styles.referralLabel}>
            {t('your_code') || 'Your Code:'}
          </Text>
          <TouchableOpacity
            style={styles.referralCodeBox}
            onPress={copyCodeToClipboard}>
            <Text style={styles.referralCodeText}>
              {referralCode || 'N/A'}
            </Text>
            <Ionicons
              name="copy-outline"
              size={18}
              color="#fff"
              style={{marginLeft: 6}}
            />
          </TouchableOpacity>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareButtonsContainer}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareViaWhatsApp}>
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={copyLinkToClipboard}>
            <Ionicons name="link-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareReferralCode}>
            <Ionicons name="share-social-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

/**
 * Dynamic styles based on theme and screen dimensions
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {object} StyleSheet object
 */
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
      fontFamily: 'RobotoSlab-SemiBold',
    },
    subTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#ccc' : '#212121',
      marginTop: 5,
      fontFamily: 'RobotoSlab-Medium',
    },
    subDescription: {
      fontSize: 14,
      color: isDarkMode ? '#aaa' : '#757575',
      marginTop: 5,
      textAlign: 'center',
      fontFamily: 'RobotoSlab-Regular',
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
      fontFamily: 'RobotoSlab-Regular',
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
      fontFamily: 'RobotoSlab-Medium',
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
      fontFamily: 'RobotoSlab-Regular',
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
      fontFamily: 'RobotoSlab-SemiBold',
    },
    referralDetails: {
      flex: 1,
    },
    referralName: {
      fontSize: 16,
      fontWeight: '500',
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Medium',
    },
    referralStatus: {
      fontSize: 14,
      marginTop: 2,
      fontFamily: 'RobotoSlab-Regular',
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
      fontFamily: 'RobotoSlab-SemiBold',
    },
    contactDetails: {
      flex: 1,
    },
    contactName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDarkMode ? '#fff' : '#212121',
      fontFamily: 'RobotoSlab-Medium',
    },
    contactNumber: {
      fontSize: 14,
      color: isDarkMode ? '#ccc' : '#757575',
      marginTop: 2,
      fontFamily: 'RobotoSlab-Regular',
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
      fontFamily: 'RobotoSlab-Medium',
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
      fontFamily: 'RobotoSlab-Medium',
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
      fontFamily: 'RobotoSlab-SemiBold',
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
