import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Clipboard,
  Share,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import EncryptedStorage from 'react-native-encrypted-storage';
import Contacts from 'react-native-contacts';
import { SafeAreaView } from 'react-native-safe-area-context';

const ReferralScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [showContacts, setShowContacts] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState(null);
  const [referralLink, setReferralLink] = useState(null);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const token = await EncryptedStorage.getItem('cs_token');
        if (!token) {
          console.error("No token found in storage.");
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

        console.log('Original Data:', response.data);
        
        if (response.data.length > 0) {
          const data = response.data[0];
          const refundCode = data.referralcode;
          console.log("date", refundCode);

          // Set code and link
          setReferralCode(refundCode);
          setReferralLink(`https://play.google.com/apps/internaltest/4701348414051959035?referralCode=${refundCode}`);

          // Transform referral data
        
          const transformedData = response.data
          .filter(item => item.name) // Only include items with a truthy name
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

  // 1) Separate copy function for CODE
  const copyCodeToClipboard = () => {
    if (referralCode) {
      Clipboard.setString(referralCode);
    }
  };

  // 2) Separate copy function for LINK
  const copyLinkToClipboard = () => {
    if (referralLink) {
      Clipboard.setString(referralLink);
    }
  };

  const shareReferralCode = async () => {
    try {
      const result = await Share.share({
        message: `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  // 3) Direct or normal WhatsApp share
  const shareViaWhatsApp = () => {
    const whatsappMessage = `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(whatsappMessage)}`;

    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } 
      })
      .catch(err => console.error('Error opening WhatsApp:', err));
  };

  // 4) SMS invite
  const inviteViaSMS = (phoneNumber) => {
    if (!phoneNumber) return;
    const smsMessage = `Join me on this amazing app! Use my referral code: ${referralCode}. Download the app now: ${referralLink}`;
    const url = `sms:${phoneNumber}?body=${encodeURIComponent(smsMessage)}`;

    Linking.openURL(url).catch(err => {
      console.error('Error launching SMS app:', err);
    });
  };

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

  const renderContactItem = ({item}) => {
    const phoneNumber = item.phoneNumbers && item.phoneNumbers.length > 0
      ? item.phoneNumbers[0].number.replace(/\s+/g, '')
      : null;

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => inviteViaSMS(phoneNumber)}
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.contactInitials}>
            {item.displayName ? item.displayName[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.contactDetails}>
          <Text style={styles.contactName}>{item.displayName}</Text>
          {item.phoneNumbers && item.phoneNumbers.length > 0 && (
            <Text style={styles.contactNumber}>
              {item.phoneNumbers[0].number}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => inviteViaSMS(phoneNumber)}
        >
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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

  const renderReferralItem = ({item}) => (
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
          ]}>
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>

        {/* Title and Subtitle */}
        <View style={styles.header}>
          <Text style={styles.title}>Refer Friends</Text>
          <Text style={styles.subtitle}>Invite your friends</Text>
          <Text style={styles.description}>
            ...to the cool new way of managing money!
          </Text>
        </View>

        {/* How It Works Section */}
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

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, !showContacts && styles.activeTab]}
            onPress={() => setShowContacts(false)}>
            <Text style={styles.tabText}>Your Referrals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, showContacts && styles.activeTab]}
            onPress={fetchContacts}>
            <Text style={styles.tabText}>Invite Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Content Area */}
        <View style={{ flex: 1 }}>
          {!showContacts ? (
            referrals.length > 0 && (
              <FlatList
                data={referrals}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderReferralItem}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.recordID}
              renderItem={renderContactItem}
              contentContainerStyle={[styles.contactList, { flexGrow: 1 }]}
            />
          )}
        </View>

        {/* Referral Code Section */}
        <View style={styles.referralCodeSection}>
          <Text style={styles.referralLabel}>Your Code:</Text>
          <TouchableOpacity
            style={styles.copyCodeContainer}
            onPress={copyCodeToClipboard}>
            <Text style={styles.referralCode}>{referralCode || 'N/A'}</Text>
            <Ionicons
              name="copy-outline"
              size={20}
              color="#ffffff"
              style={styles.copyIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareButtons}>
          <TouchableOpacity style={styles.shareButton} onPress={shareViaWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={copyLinkToClipboard}>
            <Ionicons name="link-outline" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareReferralCode}>
            <Ionicons name="share-social-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 10,
    position: 'absolute',
    top: 10,
    left: 5,
    zIndex: 10,
  },
  header: {
    marginTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
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
    textAlign: 'center',
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
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
  },
  tab: {
    fontSize: 16,
    color: '#ff5722',
    textAlign: 'center',
    paddingVertical: 10,
    flex: 1,
  },
  activeTab: {
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#4A148C',
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
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
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    color: '#212121',
  },
  referralStatus: {
    fontSize: 14,
  },
  statusPending: {
    color: 'orange',
  },
  statusCompleted: {
    color: 'green',
  },
  referralCodeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  referralLabel: {
    fontSize: 16,
    color: '#212121',
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
    marginBottom: 10,
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
  contactList: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
});

export default ReferralScreen;
