import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Clipboard,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const referrals = [{id: 1, name: 'Alikana Teja'}];

const ReferralScreen = () => {
  const copyCodeToClipboard = () => {
    Clipboard.setString('V87LCFQLT8');
    alert('Code copied to clipboard!');
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Title and Subtitle */}
      <View style={styles.header}>
        <Text style={styles.title}>Refer friends</Text>
        <Text style={styles.subtitle}>Invite your friends</Text>
        <Text style={styles.description}>
          ...to the cool new way of managing money!
        </Text>
      </View>

      {/* How It Works Section */}
      <View style={styles.howItWorks}>
        <View style={styles.step}>
          <Ionicons name="document-text-outline" size={20} color="#6C63FF" />
          <Text style={styles.stepText}>
            Share your referral link or code with a friend.
          </Text>
        </View>
        <View style={styles.step}>
          <Ionicons name="person-add-outline" size={20} color="#6C63FF" />
          <Text style={styles.stepText}>
            Your friend joins Fi using your link or code.
          </Text>
        </View>
        <View style={styles.step}>
          <Ionicons name="gift-outline" size={20} color="#6C63FF" />
          <Text style={styles.stepText}>
            Both you and your friend enjoy benefits of Fi Federal Savings
            account.
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Text style={[styles.tab, styles.activeTab]}>Your Referrals</Text>
        <Text style={styles.tab}>Invite contacts</Text>
      </View>

      {/* Referrals List */}
      <FlatList
        data={referrals}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View style={styles.referralItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.referralName}>{item.name}</Text>
          </View>
        )}
      />

      {/* Referral Code */}
      <View style={styles.referralCodeSection}>
        <Text style={styles.referralLabel}>Share your code:</Text>
        <TouchableOpacity
          style={styles.copyCodeContainer}
          onPress={copyCodeToClipboard}>
          <Text style={styles.referralCode}>V87LCFQLT8</Text>
          <Ionicons
            name="copy-outline"
            size={20}
            color="#6C63FF"
            style={styles.copyIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Share Buttons */}
      <View style={styles.shareButtons}>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="logo-whatsapp" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="link-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE7F6',
  },
  backButton: {
    padding: 10,
    position: 'absolute',
    top: 40,
    left: 10,
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
    color: '#6C63FF',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6C63FF',
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#6C63FF',
    marginTop: 5,
    textAlign: 'center',
  },
  howItWorks: {
    backgroundColor: '#D1C4E9',
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
    color: '#4A148C',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
  },
  tab: {
    fontSize: 16,
    color: '#6A1B9A',
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
    backgroundColor: '#B39DDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  referralName: {
    fontSize: 16,
    color: '#4A148C',
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
    color: '#6A1B9A',
  },
  copyCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1C4E9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  referralCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  copyIcon: {
    marginLeft: 5,
  },
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  shareButton: {
    backgroundColor: '#6C63FF',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
});

export default ReferralScreen;
