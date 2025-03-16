import axios from 'axios';
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import { RadioButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
// Import the theme hook from your context
import { useTheme } from '../context/ThemeContext';

const ApprovalStatusScreen = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const styles = dynamicStyles(width, isDarkMode);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [showLogout, setShowLogout] = useState(false);
  const [userName, setUserName] = useState('');
  const [userService, setUserService] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [issues, setIssues] = useState([]);
  const rotation = useState(new Animated.Value(0))[0];
  const navigation = useNavigation();

  const statuses = [
    'Mobile Number Verified',
    'Details Verified',
    'Profile and Proof Verified',
    'Bank account Verified',
  ];

  useEffect(() => {
    const fetchApprovalDetails = async () => {
      try {
        const pcs_token = await EncryptedStorage.getItem('pcs_token');
        if (!pcs_token) {
          throw new Error('PCS token is missing.');
        }

        const response = await axios.post(
          'http://192.168.55.101/api/check/approval/verification/status',
          {},
          {
            headers: {
              Authorization: `Bearer ${pcs_token}`, 
            },
          },
        );

        if (response.status === 201) {
          await EncryptedStorage.setItem('verification', 'true');
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Tabs', state: { routes: [{ name: 'Home' }] } }],
            }),
          );
        } else if (response.status === 200) {
          const { data } = response;
          console.log(data)
          setUserName(data.name || '');
          setUserService(data.service || '');
          setVerificationStatus(data.verification_status || '');
          setIssues(Array.isArray(data.issues) ? data.issues : []); 
        }
      } catch (error) {
        console.error('Error fetching approval status data:', error);
        setIssues([]); // Reset issues on error
      }
    };
    fetchApprovalDetails();
  }, [navigation]);

  const getTimelineData = useMemo(() => {
    const currentStatusIndex = statuses.indexOf(verificationStatus);
    return statuses.map((status, index) => {
      const hasIssue =
        Array.isArray(issues) &&
        issues.some(issue => issue.category === status);

      return {
        title: status,
        iconColor: index <= currentStatusIndex ? '#ff4500' : '#a1a1a1',
        lineColor: index < currentStatusIndex ? '#ff4500' : '#a1a1a1',
        isSelectable: index > currentStatusIndex && hasIssue,
      };
    });
  }, [verificationStatus, issues]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotation]);

  const toggleLogout = () => setShowLogout(prev => !prev);

  const handleLogout = async () => {
    try {
      // Remove various items from EncryptedStorage
      await EncryptedStorage.removeItem('partnerSteps');
      await EncryptedStorage.removeItem('start_time');
      await EncryptedStorage.removeItem('notifications');
      await EncryptedStorage.removeItem('workerPreviousLocation');
      await EncryptedStorage.removeItem('Requestnotifications');
      await EncryptedStorage.removeItem('verification');
      await EncryptedStorage.removeItem('sign_up');
      await EncryptedStorage.removeItem('start_work_time');
      await EncryptedStorage.removeItem('fcm_token');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert(
        'Logout Failed',
        'An error occurred while trying to logout. Please try again.',
      );
    }
  };

  const handleSetupChange = () => {
    if (selectedStatus) {
      if (
        selectedStatus === 'Details Verified' ||
        selectedStatus === 'Profile and Proof Verified'
      ) {
        navigation.push('WorkerProfile');
      } else if (selectedStatus === 'Bank account Verified') {
        navigation.push('BankAccountScreen');
      }
      Alert.alert(
        'Status Change',
        `You have selected to change status to: ${selectedStatus}`,
      );
    } else {
      Alert.alert('No Status Selected', 'Please select a status to proceed.');
    }
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Approval Status</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Text style={styles.helpText}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleLogout}>
            <Icon name="more-vert" size={24} color={isDarkMode ? '#dddddd' : '#1D2951'} />
          </TouchableOpacity>
        </View>
        {showLogout && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.profileContainer}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitials}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userTitle}>{userService}</Text>
          </View>
        </View>
        <Text style={styles.statusText}>
          Your profile is under review by the administrator.
        </Text>

        <View style={styles.innerContainerLine}>
          {getTimelineData.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons
                  name="circle"
                  size={14}
                  color={item.iconColor}
                  style={styles.timelineIcon}
                />
                {index !== getTimelineData.length - 1 && (
                  <View
                    style={[
                      styles.lineSegment,
                      { backgroundColor: item.lineColor },
                    ]}
                  />
                )}
              </View>
              <View style={styles.timelineTextContainer}>
                <Text style={styles.timelineText}>{item.title}</Text>
              </View>
              {item.isSelectable && (
                <RadioButton
                  value={item.title}
                  status={selectedStatus === item.title ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedStatus(item.title)}
                  color="#ff4500"
                  style={styles.radioButton}
                />
              )}
            </View>
          ))}
        </View>

        {Array.isArray(issues) && issues.length > 0 && (
          <View style={styles.issuesContainer}>
            <Text style={styles.issuesTitle}>Issues Raised:</Text>
            {issues.map((issue, index) => (
              <Text key={index} style={styles.issueText}>
                • {issue.description}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.noteText}>
          Please check back later or modify your profile if any issues are
          reported.
        </Text>
        <TouchableOpacity style={styles.setupChangeButton} onPress={handleSetupChange}>
          <Text style={styles.setupChangeText}>Setup Change</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function dynamicStyles(width, isDarkMode) {
  const isTablet = width >= 600;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 10,
      backgroundColor: isDarkMode ? '#333333' : '#f5f5f5',
    },
    headerText: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#1D2951',
      textAlign: 'center',
      flex: 1,
    },
    headerIcons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    helpText: {
      fontSize: isTablet ? 15 : 14,
      color: '#FF5722',
      fontWeight: '500',
      marginRight: 10,
    },
    logoutButton: {
      backgroundColor: isDarkMode ? '#444444' : '#ffffff',
      padding: 10,
      width: 70,
      borderRadius: 5,
      elevation: 2,
      position: 'absolute',
      top: 50,
      right: 10,
    },
    logoutText: {
      color: isDarkMode ? '#ffffff' : '#4a4a4a',
      fontWeight: 'bold',
    },
    contentContainer: {
      padding: 16,
    },
    profileContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 10,
    },
    profileCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#FF7A22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileInitials: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    profileTextContainer: {
      marginLeft: 10,
    },
    userName: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    userTitle: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#cccccc' : '#4a4a4a',
    },
    statusText: {
      fontSize: isTablet ? 16 : 14,
      color: isDarkMode ? '#eeeeee' : '#212121',
      marginBottom: 20,
      textAlign: 'center',
    },
    innerContainerLine: {
      paddingLeft: 16,
      marginBottom: 20,
      marginTop: 15,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    timelineIcon: {
      marginBottom: 4,
    },
    lineSegment: {
      width: 2,
      height: 40,
    },
    timelineTextContainer: {
      flex: 1,
      marginLeft: 10,
    },
    timelineText: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
      fontWeight: 'bold',
    },
    radioButton: {
      marginRight: 16,
    },
    issuesContainer: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: isDarkMode ? '#5a3c39' : '#FFE4E1',
      borderRadius: 10,
    },
    issuesTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: '#ff4500',
      marginBottom: 5,
    },
    issueText: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#ffffff' : '#212121',
    },
    noteText: {
      fontSize: isTablet ? 15 : 14,
      color: isDarkMode ? '#eeeeee' : '#212121',
      textAlign: 'center',
      marginVertical: 20,
    },
    setupChangeButton: {
      backgroundColor: '#FF5722',
      borderRadius: 20,
      paddingVertical: 12,
      paddingHorizontal: 32,
      alignSelf: 'center',
    },
    setupChangeText: {
      fontSize: isTablet ? 17 : 16,
      color: '#ffffff',
      fontWeight: 'bold',
    },
  });
}

export default ApprovalStatusScreen;
