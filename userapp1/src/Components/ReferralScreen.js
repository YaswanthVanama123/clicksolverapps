import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Share,
  Linking,
  PermissionsAndroid,
  ScrollView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import Contacts from 'react-native-contacts';
import {SafeAreaView} from 'react-native-safe-area-context';

const ReferralScreen = () => {
  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState(null);

  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);

  // Build a dynamic referral link using your referralCode (once retrieved)
  const referralLink = referralCode
    ? `https://example.com/download?referralCode=${referralCode}`
    : '';

  // 1) Fetch referrals from the backend
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const token = await EncryptedStorage.getItem('cs_token');
        console.log('Token from EncryptedStorage:', token);

        // IMPORTANT: Depending on your server setup, you might need
        // either GET with no extra object param or pass headers differently
        const response = await axios.get(
          'https://backend.clicksolver.com/api/user/referrals',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log('API Response:', response.data);

        if (Array.isArray(response.data) && response.data.length > 0) {
          // The first item may have the referralCode
          const data = response.data[0];
          if (data.referralCode) {
            setReferralCode(data.referralCode);
          }

          // Transform each item to ensure no null values & map statuses
          const transformedData = response.data.map((item, index) => ({
            id: index, // or item._id if your API returns an ID
            name: item.name ?? 'Unknown',
            status: item.status_completed ? 'Completed' : 'Pending',
          }));

          setReferrals(transformedData);
        } else {
          // If array is empty, set no referrals
          setReferrals([]);
        }
      } catch (error) {
        console.log('Error fetching referrals:', error);
      }
    };

    fetchReferrals();
  }, []);

  // 2) Permissions for Android to read contacts
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
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // 3) Fetch device contacts
  const fetchContacts = async () => {
    try {
      const permission = await requestContactsPermission();
      if (!permission) {
        return;
      }
      const contactsList = await Contacts.getAll();
      setContacts(contactsList);
      setShowContacts(true);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  // 4) Copy the referral link (which includes the code) to clipboard
  const copyLinkToClipboard = () => {
    if (referralLink) {
      Clipboard.setString(referralLink);
      console.log('Referral link copied to clipboard:', referralLink);
    }
  };

  // 5) Invite contact placeholder (SMS logic could go here)
  const inviteContact = contact => {
    // Implement SMS or other invite logic. Example with linking to SMS:
    // const phoneNumber = contact.phoneNumbers?.[0]?.number || '';
    // Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(yourMessage)}`);
    console.log('Invite contact pressed:', contact.displayName);
  };

  // 6) Share referral code via system share sheet
  const shareReferralCode = async () => {
    try {
      const message = `Join me on this amazing app! Use my referral code: ${referralCode}. Download now: ${referralLink}`;
      const result = await Share.share({
        message,
      });
      if (result.action === Share.sharedAction) {
        console.log('Shared successfully:', result.activityType);
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  // 7) Share on WhatsApp specifically
  const shareViaWhatsApp = () => {
    if (!referralCode || !referralLink) return;
    const whatsappMessage = `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(
      whatsappMessage,
    )}`;

    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          console.log('WhatsApp not installed or not supported.');
        }
      })
      .catch(err => console.error('Error opening WhatsApp:', err));
  };

  // 8) Render referrals dynamically (no FlatList, just map for simplicity)
  const renderReferrals = () => {
    if (!referrals || referrals.length === 0) {
      return <Text style={styles.noContactsText}>No referrals yet!</Text>;
    }
    return referrals.map(item => (
      <View key={item.id} style={styles.referralItem}>
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
            ]}>
            {item.status}
          </Text>
        </View>
      </View>
    ));
  };

  // 9) Render contacts dynamically
  const renderContacts = () => {
    if (!contacts || contacts.length === 0) {
      return <Text style={styles.noContactsText}>No contacts to invite</Text>;
    }
    return contacts.map(contact => (
      <View key={contact.recordID} style={styles.contactItem}>
        <View style={styles.contactAvatar}>
          <Text style={styles.contactInitials}>
            {contact.displayName ? contact.displayName[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{contact.displayName}</Text>
          {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
            <Text style={styles.contactNumber}>
              {contact.phoneNumbers[0].number}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => inviteContact(contact)}>
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* We wrap everything in ONE ScrollView so we can use stickyHeaderIndices */}
      <ScrollView
        stickyHeaderIndices={[2]}
        // Child index 0 = top header
        // Child index 1 = how-it-works
        // Child index 2 = the tab bar (pinned when scrolling)
      >
        {/* (0) Top Header Section */}
        <View style={styles.headerContainer}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>

          <Text style={styles.title}>Refer Friends</Text>
          <Text style={styles.subtitle}>Invite your friends</Text>
          <Text style={styles.description}>
            ...to the cool new way of managing money!
          </Text>
        </View>

        {/* (1) The "How It Works" orange container */}
        <View style={styles.howItWorks}>
          <View style={styles.step}>
            <Ionicons name="document-text-outline" size={20} color="#ffffff" />
            <Text style={styles.stepText}>
              Share your referral link or code with a friend.
            </Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="person-add-outline" size={20} color="#ffffff" />
            <Text style={styles.stepText}>
              Your friend joins using your link or code.
            </Text>
          </View>
          <View style={styles.step}>
            <Ionicons name="gift-outline" size={20} color="#ffffff" />
            <Text style={styles.stepText}>
              Both you and your friend enjoy amazing benefits.
            </Text>
          </View>
        </View>

        {/* (2) Sticky Tab Bar */}
        <View style={styles.tabs}>
          <View>
            <TouchableOpacity
              style={[styles.tab, !showContacts && styles.activeTab]}
              onPress={() => setShowContacts(false)}>
              <Text style={styles.tabText}>Your Referrals</Text>
            </TouchableOpacity>
          </View>
          <View>
            <TouchableOpacity
              style={[styles.tab, showContacts && styles.activeTab]}
              onPress={fetchContacts}>
              <Text style={styles.tabText}>Invite Contacts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* (3) Content Below Tabs (scrolls behind pinned tabs) */}
        <View style={styles.contentBelowTabs}>
          {showContacts ? renderContacts() : renderReferrals()}
        </View>

        {/* (4) Referral Code Section */}
        <View style={styles.referralCodeSection}>
          <Text style={styles.referralLabel}>Share your code:</Text>
          <TouchableOpacity
            style={styles.copyCodeContainer}
            onPress={copyLinkToClipboard}
            disabled={!referralCode}>
            <Text style={styles.referralCode}>
              {referralCode ? referralCode : 'Loading...'}
            </Text>
            <Ionicons
              name="copy-outline"
              size={20}
              color="#ffffff"
              style={styles.copyIcon}
            />
          </TouchableOpacity>
        </View>

        {/* (5) Share Buttons Section */}
        <View style={styles.shareButtons}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareViaWhatsApp}
            disabled={!referralCode}>
            <Ionicons name="logo-whatsapp" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={copyLinkToClipboard}
            disabled={!referralCode}>
            <Ionicons name="link-outline" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareReferralCode}
            disabled={!referralCode}>
            <Ionicons name="share-social-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 5,
  },
  howItWorks: {
    backgroundColor: '#FF8A66',
    borderRadius: 10,
    padding: 15,
    margin: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#ffffff',
  },

  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff', // so it stays solid behind the sticky header
  },
  tab: {
    paddingVertical: 10,
    flex: 1,
    textAlign: 'center',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#212121',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff5722',
  },
  contentBelowTabs: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff5722',
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
    flexDirection: 'column',
  },
  referralName: {
    fontSize: 16,
    color: '#212121',
  },
  referralStatus: {
    fontSize: 14,
    color: '#757575',
  },
  statusPending: {
    // Example color or style for Pending
    color: '#FFA726',
  },
  statusCompleted: {
    // Example color or style for Completed
    color: '#4CAF50',
  },

  referralCodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  referralLabel: {
    fontSize: 16,
    color: '#212121',
    marginRight: 10,
  },
  copyCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff5722',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  copyIcon: {
    marginLeft: 5,
  },

  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 40,
  },
  shareButton: {
    backgroundColor: '#ff5722',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },

  // Contacts
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    // Example shadow/elevation
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInitials: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  contactNumber: {
    fontSize: 14,
    color: '#757575',
  },
  inviteButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  noContactsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575',
    marginVertical: 10,
  },
});

export default ReferralScreen;
