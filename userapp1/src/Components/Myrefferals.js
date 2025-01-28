// ReferFriendsScreen.js

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';

const Myrefferals = () => {
  const handleShareWhatsApp = () => {
    // Logic to share via WhatsApp
    console.log('Share via WhatsApp');
  };

  const handleCopyCode = () => {
    // Logic to copy code to clipboard
    console.log('Code copied to clipboard');
  };

  const handleInviteFriends = () => {
    // Logic to open contacts or share link
    console.log('Invite friends triggered');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* Add a back arrow icon here if needed */}
          <Text style={styles.headerTitle}>Refer Friends</Text>
        </View>

        {/* Top Section */}
        <View style={styles.topSection}>
          <View style={styles.imagePlaceholder} />
          <Text style={styles.inviteTitle}>Invite your friends</Text>
          <Text style={styles.inviteSubtitle}>
            ...to the cool new way of managing money!
          </Text>
        </View>

        {/* How It Works Section */}
        <View style={styles.howItWorksContainer}>
          <View style={styles.howItWorksHeader}>
            <Text style={styles.howItWorksTitle}>How it works</Text>
            <TouchableOpacity>
              <Text style={styles.viewTncs}>View TnCs</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.stepsRow}>
            {[
              'Share your referral link or code with a friend.',
              'Your friend joins Fi using your link or code.',
              'Both you and your friend enjoy benefits of Fi Federal Savings account.',
            ].map((step, index) => (
              <View key={index} style={styles.stepBox}>
                <View style={styles.smallIconPlaceholder} />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs Section */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
            <Text style={styles.tabTextActive}>Your Referrals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Text style={styles.tabText}>Invite Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Referral Item */}
        <View style={styles.referralItem}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>AT</Text>
          </View>
          <Text style={styles.referralName}>Alikana Teja</Text>
        </View>

        {/* Share Code Section */}
        <View style={styles.shareCodeContainer}>
          <Text style={styles.shareCodeText}>
            Share your code: <Text style={styles.boldCode}>V87LCFQLT8</Text>
          </Text>
          <TouchableOpacity
            onPress={handleCopyCode}
            style={styles.copyIconPlaceholder}>
            {/* Add "Copy" icon/image here */}
          </TouchableOpacity>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareButtonsRow}>
          <TouchableOpacity
            onPress={handleShareWhatsApp}
            style={styles.shareButtonWhatsApp}>
            <Text style={styles.shareButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleInviteFriends}
            style={styles.shareButtonLink}>
            <Text style={styles.shareButtonText}>Link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleInviteFriends}
            style={styles.shareButtonInvite}>
            <Text style={styles.shareButtonText}>Invite Friends</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Myrefferals;

const PURPLE = '#7C4DFF';
const WHITE = '#FFFFFF';
const GRAY = '#999999';
const DARK_GRAY = '#555555';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scrollContainer: {
    backgroundColor: PURPLE,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: WHITE,
    fontSize: 18,
    fontWeight: '600',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: WHITE,
    borderRadius: 16,
    marginBottom: 16,
  },
  inviteTitle: {
    fontSize: 24,
    color: WHITE,
    fontWeight: '700',
    marginBottom: 4,
  },
  inviteSubtitle: {
    fontSize: 14,
    color: WHITE,
    textAlign: 'center',
  },
  howItWorksContainer: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
  },
  viewTncs: {
    fontSize: 14,
    color: PURPLE,
    fontWeight: '500',
  },
  stepsRow: {
    flexDirection: 'column',
  },
  stepBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  smallIconPlaceholder: {
    width: 32,
    height: 32,
    backgroundColor: PURPLE,
    borderRadius: 16,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    color: DARK_GRAY,
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: PURPLE,
  },
  tabTextActive: {
    color: PURPLE,
    fontWeight: '600',
  },
  tabText: {
    color: GRAY,
    fontWeight: '500',
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: WHITE,
    fontWeight: '600',
  },
  referralName: {
    fontSize: 16,
    color: DARK_GRAY,
  },
  shareCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  shareCodeText: {
    fontSize: 16,
    color: DARK_GRAY,
    flex: 1,
  },
  boldCode: {
    fontWeight: '700',
    color: DARK_GRAY,
  },
  copyIconPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: PURPLE,
    borderRadius: 4,
    marginLeft: 8,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  shareButtonWhatsApp: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#25D366', // WhatsApp green
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonLink: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: PURPLE,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonInvite: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: DARK_GRAY,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: WHITE,
    fontWeight: '600',
  },
});
