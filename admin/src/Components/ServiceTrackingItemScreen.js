// ServiceTrackingItemScreen.jsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import SwipeButton from 'rn-swipe-button';
import {RadioButton} from 'react-native-paper';
import {useRoute, useNavigation} from '@react-navigation/native';
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';
import {SafeAreaView} from 'react-native-safe-area-context';

/* --------------------- Small UI bits --------------------- */

const ProgressBar = ({value = 0, tint = '#7B6CFF'}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const v = Math.max(0, Math.min(1, value));
  useEffect(() => {
    Animated.timing(anim, {
      toValue: v,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [v]);
  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, {width, backgroundColor: tint}]} />
    </View>
  );
};

const Step = ({active, done, label, onPress}) => (
  <TouchableOpacity
    style={styles.stepWrap}
    activeOpacity={0.9}
    onPress={onPress}>
    <View
      style={[
        styles.stepDot,
        done ? styles.stepDone : active ? styles.stepActive : styles.stepIdle,
      ]}>
      {done ? (
        <MaterialCommunityIcons name="check" size={14} color="#fff" />
      ) : null}
    </View>
    <Text
      style={[
        styles.stepLabel,
        (active || done) && {color: '#111827', fontWeight: '800'},
      ]}
      numberOfLines={1}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* --------------------- Screen --------------------- */

const STATUSES = [
  'Collected Item',
  'Work started',
  'Work Completed',
  'Delivered',
];

const ServiceTrackingItemScreen = () => {
  const {tracking_id} = useRoute().params;
  const navigation = useNavigation();

  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);

  const [details, setDetails] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});
  const [serviceArray, setServiceArray] = useState([]);

  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Fetch
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const {
          data: {data, paymentDetails},
        } = await axios.post(
          'https://backend.clicksolver.com/api/service/tracking/worker/item/details',
          {tracking_id},
        );
        setDetails(data);
        setPaymentDetails(paymentDetails || {});
        setServiceArray(
          Array.isArray(data?.service_booked) ? data.service_booked : [],
        );
      } catch (e) {
        console.log('fetch error', e?.message);
      }
    };
    fetchBookings();
  }, [tracking_id]);

  const currentIndex = useMemo(
    () =>
      Math.max(
        0,
        STATUSES.indexOf(details?.service_status || 'Collected Item'),
      ),
    [details?.service_status],
  );

  const progress = useMemo(
    () => currentIndex / (STATUSES.length - 1),
    [currentIndex],
  );

  const handleEditPress = () => setEditVisible(v => !v);

  const applyStatusChange = async newStatus => {
    try {
      await axios.post(
        'https://backend.clicksolver.com/api/service/tracking/update/status',
        {tracking_id, newStatus},
      );
      setDetails(d => ({...d, service_status: newStatus}));
      setSelectedStatus('');
      setEditVisible(false);
    } catch (e) {
      console.log('Failed to update status', e?.message);
      Alert.alert('Update failed', 'Please try again.');
    }
  };

  const handleStatusTap = (status, idx) => {
    if (!isEditVisible) return;
    if (idx <= currentIndex) return; // only future steps
    setSelectedStatus(status);
    Alert.alert('Confirm change', `Change status to "${status}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Yes', onPress: () => applyStatusChange(status)},
    ]);
  };

  const openGoogleMaps = () => {
    Geolocation.getCurrentPosition(
      pos => {
        const {latitude, longitude} = pos.coords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${details.latitude},${details.longitude}&travelmode=driving`;
        Linking.openURL(url).catch(err => console.log('maps error', err));
      },
      err => console.log('geo error', err),
    );
  };

  const ThumbIcon = useMemo(
    () => () =>
      (
        <View style={styles.thumbContainer}>
          {swiped ? (
            <Entypo name="check" size={20} color="#ff4500" />
          ) : (
            <Icon name="arrow-right-long" size={15} color="#ff4500" />
          )}
        </View>
      ),
    [swiped],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left-long" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Tracking</Text>
        <TouchableOpacity onPress={handleEditPress}>
          <Text style={styles.headerAction}>
            {isEditVisible ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 88}}>
        {/* Customer Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {details?.name ? details.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{details?.name || '—'}</Text>
              <Text style={styles.smallMuted}>{details?.mobile || '—'}</Text>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => Linking.openURL(`tel:${details?.mobile}`)}>
                <MaterialIcons name="call" size={18} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={openGoogleMaps}>
                <MaterialCommunityIcons
                  name="navigation-variant"
                  size={18}
                  color="#111827"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Status & Timeline */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Status</Text>
            <View style={[styles.badge, {borderColor: '#7B6CFF'}]}>
              <Text style={[styles.badgeText, {color: '#7B6CFF'}]}>
                {details?.service_status || '—'}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <ProgressBar value={progress} tint="#7B6CFF" />
          <Text style={styles.progressCaption}>
            Step {currentIndex + 1} of {STATUSES.length}
          </Text>

          {/* Stepper */}
          <View style={styles.stepperRow}>
            {STATUSES.map((s, i) => (
              <React.Fragment key={s}>
                <Step
                  label={s}
                  active={i === currentIndex}
                  done={i < currentIndex}
                  onPress={() => handleStatusTap(s, i)}
                />
                {i < STATUSES.length - 1 && <View style={styles.connector} />}
              </React.Fragment>
            ))}
          </View>

          {isEditVisible && selectedStatus.length > 0 && (
            <View style={styles.pendingRow}>
              <RadioButton
                value={selectedStatus}
                status={'checked'}
                onPress={() => {}}
                color="#ff4500"
              />
              <Text style={styles.pendingText}>
                Pending change to “{selectedStatus}”
              </Text>
            </View>
          )}
        </View>

        {/* Services Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Details</Text>
          {serviceArray.length === 0 ? (
            <Text style={styles.smallMuted}>No services found.</Text>
          ) : (
            serviceArray.map((s, idx) => (
              <View key={idx} style={styles.rowBetween}>
                <Text style={styles.itemText}>{s.serviceName}</Text>
                <Text style={styles.itemBold}>₹{s.cost}.00</Text>
              </View>
            ))
          )}
        </View>

        {/* Address Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Address</Text>
          <View style={[styles.row, {alignItems: 'flex-start'}]}>
            <Image
              source={{
                uri: 'https://i.postimg.cc/qvJw8Kzy/Screenshot-2024-11-13-170828-removebg-preview.png',
              }}
              style={styles.pin}
            />
            <Text style={styles.addrText}>{details?.area || '—'}</Text>
          </View>
          <TouchableOpacity style={styles.mapBtn} onPress={openGoogleMaps}>
            <Text style={styles.mapBtnText}>Open in Google Maps</Text>
            <MaterialCommunityIcons
              name="navigation-variant"
              size={18}
              color="#9ca3af"
            />
          </TouchableOpacity>
        </View>

        {/* Payment Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          {serviceArray.map((s, idx) => (
            <View key={idx} style={styles.rowBetween}>
              <Text style={styles.itemText}>{s.serviceName}</Text>
              <Text style={styles.itemBold}>₹{s.cost}.00</Text>
            </View>
          ))}
          <View style={styles.rowBetween}>
            <Text style={styles.itemText}>SGST (5%)</Text>
            <Text style={styles.itemBold}>₹{paymentDetails.cgstAmount}.00</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.itemText}>CGST (5%)</Text>
            <Text style={styles.itemBold}>₹{paymentDetails.gstAmount}.00</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.itemText}>Cashback (5%)</Text>
            <Text style={styles.itemBold}>
              ₹{paymentDetails.discountAmount}.00
            </Text>
          </View>
          <View style={[styles.rowBetween, {marginTop: 8}]}>
            <Text style={[styles.itemText, {fontWeight: '900'}]}>
              Grand Total
            </Text>
            <Text style={[styles.itemBold, {fontSize: 16}]}>
              ₹{paymentDetails.fetchedFinalTotalAmount}.00
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Swipe to deliver (sticky) */}
      <View style={styles.swipeWrap}>
        <SwipeButton
          title="Delivered"
          titleStyles={{color: titleColor, fontSize: 16, fontWeight: '700'}}
          railBackgroundColor="#ff4500"
          railBorderColor="#ff4500"
          height={46}
          railStyles={{
            borderRadius: 24,
            backgroundColor: '#ff450000',
            borderColor: '#ff450000',
          }}
          thumbIconComponent={() => (
            <View style={styles.thumbContainer}>
              {swiped ? (
                <Entypo name="check" size={20} color="#ff4500" />
              ) : (
                <Icon name="arrow-right-long" size={16} color="#ff4500" />
              )}
            </View>
          )}
          thumbIconBackgroundColor="#fff"
          thumbIconBorderColor="#fff"
          thumbIconWidth={44}
          thumbIconStyles={{height: 36, width: 36, borderRadius: 20}}
          onSwipeStart={() => setTitleColor('#e5e7eb')}
          onSwipeSuccess={() => {
            navigation.push('TrackingConfirmation', {trackingId: tracking_id});
            setTitleColor('#FFFFFF');
            setSwiped(true);
          }}
          onSwipeFail={() => setTitleColor('#FFFFFF')}
        />
      </View>
    </SafeAreaView>
  );
};

/* --------------------- Styles --------------------- */

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7FB'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  headerTitle: {fontSize: 18, fontWeight: '900', color: '#111827'},
  headerAction: {color: '#7B6CFF', fontWeight: '800'},

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
  },

  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF7A22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: '#fff', fontSize: 22, fontWeight: '900'},
  name: {fontSize: 16, fontWeight: '900', color: '#111827'},
  smallMuted: {fontSize: 12, color: '#6b7280'},

  actionsRow: {flexDirection: 'row', gap: 8},
  quickBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // progress
  barTrack: {
    height: 10,
    backgroundColor: '#EEEFF2',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {height: '100%', borderRadius: 10},

  progressCaption: {fontSize: 12, color: '#6b7280', marginTop: 6},

  // Stepper
  stepperRow: {flexDirection: 'row', alignItems: 'flex-start', marginTop: 10},
  stepWrap: {alignItems: 'center', flexShrink: 1, maxWidth: '26%'},
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIdle: {backgroundColor: '#E5E7EB'},
  stepActive: {backgroundColor: '#7B6CFF'},
  stepDone: {backgroundColor: '#22c55e'},
  stepLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'center',
  },
  connector: {
    height: 2,
    backgroundColor: '#E5E7EB',
    flex: 1,
    marginHorizontal: 6,
    marginTop: 11,
  },

  // pending change
  pendingRow: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  pendingText: {color: '#111827', fontWeight: '700'},

  // address
  pin: {width: 20, height: 20, marginRight: 6},
  addrText: {flex: 1, color: '#111827'},

  itemText: {fontSize: 14, color: '#111827'},
  itemBold: {fontSize: 14, fontWeight: '900', color: '#111827'},

  mapBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  mapBtnText: {fontWeight: '800', color: '#111827'},

  // swipe
  swipeWrap: {position: 'absolute', left: 16, right: 16, bottom: 16},
  thumbContainer: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ServiceTrackingItemScreen;
