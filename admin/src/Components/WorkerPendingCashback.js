// WorkerPendingCashback.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Animated,
  Easing,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SwipeButton from 'rn-swipe-button';
import {useRoute, useNavigation} from '@react-navigation/native';
import axios from 'axios';
import {SafeAreaView} from 'react-native-safe-area-context';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------------- Helpers ---------------- */
const INR = n => {
  const num = Number(n ?? 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  }
};
const fmtDate = d => {
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
const Section = ({title, open, onToggle, children}) => (
  <View style={styles.sectionCard}>
    <TouchableOpacity
      style={styles.sectionHead}
      onPress={onToggle}
      activeOpacity={0.9}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <MaterialCommunityIcons
        name={open ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#6b7280"
      />
    </TouchableOpacity>
    {open ? <View style={{marginTop: 8}}>{children}</View> : null}
  </View>
);

const Pill = ({text, tone = 'neutral'}) => {
  const stylesBy = {
    success: {bg: '#dcfce7', fg: '#166534'},
    warn: {bg: '#fef3c7', fg: '#92400e'},
    info: {bg: '#e0e7ff', fg: '#3730a3'},
    neutral: {bg: '#f3f4f6', fg: '#111827'},
  }[tone];
  return (
    <View style={[styles.pill, {backgroundColor: stylesBy.bg}]}>
      <Text style={[styles.pillText, {color: stylesBy.fg}]}>{text}</Text>
    </View>
  );
};

const Row = ({icon, tint = '#111827', title, subtitle, amount, date}) => (
  <View style={styles.row}>
    <View style={[styles.rowIconWrap, {backgroundColor: tint}]}>{icon}</View>
    <View style={{flex: 1}}>
      <Text style={styles.rowTitle} numberOfLines={1}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={styles.rowSub} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
      {!!date && <Text style={styles.rowDate}>{date}</Text>}
    </View>
    {!!amount && <Text style={styles.rowAmt}>{amount}</Text>}
  </View>
);

/* ---------------- Screen ---------------- */
export default function WorkerPendingCashback() {
  const navigation = useNavigation();
  const {worker_id} = useRoute().params;

  const [serviceHistory, setServiceHistory] = useState([]); // [{payment, name, amount, time}]
  const [paymentHistory, setPaymentHistory] = useState([]); // [{type, amount, date, debited}]
  const [cashbackHistory, setCashbackHistory] = useState([]); // [{amount, time}]
  const [pendingAmount, setPendingAmount] = useState(0);
  const [approvedTillDate, setApprovedTillDate] = useState(0);

  // filters (chip)
  const [chip, setChip] = useState('All'); // All | Cash | Online

  // collapsibles
  const [openService, setOpenService] = useState(true);
  const [openPayments, setOpenPayments] = useState(true);
  const [openCashback, setOpenCashback] = useState(true);

  // swipe UI
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);

  // animated pending count-up
  const [displayAmount, setDisplayAmount] = useState(0);
  const amtAnim = useRef(new Animated.Value(0)).current;

  const animateAmount = useCallback(
    to => {
      amtAnim.stopAnimation();
      Animated.timing(amtAnim, {
        toValue: to,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [amtAnim],
  );

  useEffect(() => {
    const id = amtAnim.addListener(({value}) =>
      setDisplayAmount(Math.round(value)),
    );
    return () => amtAnim.removeListener(id);
  }, [amtAnim]);

  // fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post(
          'https://backend.clicksolver.com/api/worker/pending/cashback',
          {worker_id},
        );
        const list = Array.isArray(res?.data) ? res.data : [];

        // Derive service history & totals
        let totalDelta = 0;
        const svc = list.map((tx, i) => {
          const paymentType = String(tx?.payment_type || '').toLowerCase();
          const paymentValue = Number(tx?.payment || 0);
          const delta =
            paymentType === 'cash'
              ? -(paymentValue * 0.12)
              : +(paymentValue * 0.88);
          totalDelta += delta;

          return {
            key: `svc_${i}`,
            mode: paymentType,
            payment:
              paymentType === 'cash' ? 'Paid by Cash' : 'Paid to Click Solver',
            name: tx?.name || '—',
            amount: `${delta >= 0 ? '+' : '−'} ${INR(Math.abs(delta))}`,
            time: fmtDate(tx?.end_time),
          };
        });

        const first = list[0] || {};
        const cbHist = Array.isArray(first?.cashback_history)
          ? first.cashback_history
          : [];
        const mappedCb = cbHist.map((x, i) => ({
          key: `cb_${i}`,
          amount: INR(Number(x?.amount ?? 0)),
          time: x?.time,
        }));

        const approvedTimes = Number(first?.cashback_approved_times ?? 0);
        const gained = Number(first?.cashback_gain ?? 0);
        const pending = (approvedTimes - gained) * 100; // your original math
        setPendingAmount(pending);
        setApprovedTillDate(gained * 100);

        setServiceHistory(svc);
        setCashbackHistory(mappedCb);
        setPaymentHistory(
          Array.isArray(first?.payment_history) ? first.payment_history : [],
        );

        animateAmount(pending);
      } catch (e) {
        console.log('cashback fetch error', e?.message);
        Alert.alert(
          'Error',
          'Failed to fetch cashback data. Please try again later.',
        );
      }
    };
    fetchData();
  }, [worker_id, animateAmount]);

  const settleNow = useCallback(async () => {
    const cashbackCount = pendingAmount / 100;
    try {
      await axios.post(
        'https://backend.clicksolver.com/api/worker/cashback/payed',
        {
          worker_id,
          cashbackPayed: pendingAmount,
          cashbackCount,
        },
      );
      Alert.alert('Settled', 'Cashback settled successfully.');
    } catch (e) {
      console.log('settle error', e?.message);
      Alert.alert('Failed', 'Could not settle cashback. Try again.');
    }
  }, [pendingAmount, worker_id]);

  const ThumbIcon = useCallback(
    () => (
      <View style={styles.thumbContainer}>
        {swiped ? (
          <Entypo name="check" size={20} color="#ff4500" />
        ) : (
          <FontAwesome6 name="arrow-right-long" size={18} color="#ff4500" />
        )}
      </View>
    ),
    [swiped],
  );

  const toggle = setter => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter(v => !v);
  };

  // filter view for service history
  const filteredService = useMemo(() => {
    if (chip === 'Cash') return serviceHistory.filter(s => s.mode === 'cash');
    if (chip === 'Online') return serviceHistory.filter(s => s.mode !== 'cash');
    return serviceHistory;
  }, [chip, serviceHistory]);

  // header enter animation
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const headerStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header bar */}
      <Animated.View style={[styles.topbar, headerStyle]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <FontAwesome6 name="arrow-left-long" size={18} color="#0b1220" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Cashback & Settlement</Text>
        <View style={{width: 18}} />
      </Animated.View>

      {/* Summary tiles */}
      <View style={styles.tileRow}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Pending</Text>
          <Text style={styles.tileValue}>{INR(displayAmount)}</Text>
          <Pill text="Unsettled" tone="warn" />
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Approved (to date)</Text>
          <Text style={styles.tileValue}>{INR(approvedTillDate)}</Text>
          <Pill text="Historical" tone="info" />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.chipsRow}>
        {['All', 'Cash', 'Online'].map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setChip(c)}
            style={[styles.chip, chip === c && styles.chipActive]}>
            <Text
              style={[styles.chipText, chip === c && styles.chipTextActive]}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        {/* Service Charge History */}
        <Section
          title="Service Charge History"
          open={openService}
          onToggle={() => toggle(setOpenService)}>
          {filteredService.length === 0 ? (
            <Text style={styles.emptyText}>No service charge entries.</Text>
          ) : (
            filteredService.map(it => (
              <Row
                key={it.key}
                tint={it.payment === 'Paid by Cash' ? '#f97316' : '#0ea5e9'}
                icon={
                  it.payment === 'Paid by Cash' ? (
                    <Entypo name="wallet" size={18} color="#fff" />
                  ) : (
                    <MaterialCommunityIcons
                      name="bank"
                      size={18}
                      color="#fff"
                    />
                  )
                }
                title={it.payment}
                subtitle={it.name}
                amount={it.amount}
                date={it.time}
              />
            ))
          )}
        </Section>

        {/* Payment History */}
        <Section
          title="Payment History"
          open={openPayments}
          onToggle={() => toggle(setOpenPayments)}>
          {!paymentHistory || paymentHistory.length === 0 ? (
            <Text style={styles.emptyText}>No payment records.</Text>
          ) : (
            paymentHistory.map((it, idx) => (
              <Row
                key={`pay_${idx}`}
                tint={it.debited ? '#ef4444' : '#16a34a'}
                icon={
                  <MaterialCommunityIcons
                    name={it.debited ? 'arrow-top-right' : 'arrow-bottom-left'}
                    size={18}
                    color="#fff"
                  />
                }
                title={it.type || (it.debited ? 'Paid to' : 'Received from')}
                subtitle="Click Solver"
                amount={INR(Number(it.amount ?? 0))}
                date={fmtDate(it.date)}
              />
            ))
          )}
        </Section>

        {/* Cashback History */}
        <Section
          title="Cashback History"
          open={openCashback}
          onToggle={() => toggle(setOpenCashback)}>
          {cashbackHistory.length === 0 ? (
            <Text style={styles.emptyText}>No cashback entries.</Text>
          ) : (
            cashbackHistory.map(it => (
              <Row
                key={it.key}
                tint="#8b5cf6"
                icon={
                  <MaterialCommunityIcons
                    name="cash-refund"
                    size={18}
                    color="#fff"
                  />
                }
                title="Cashback paid"
                subtitle="Click Solver"
                amount={it.amount}
                date={fmtDate(it.time)}
              />
            ))
          )}
        </Section>
      </ScrollView>

      {/* Swipe to settle */}
      <View style={styles.swipeWrap}>
        <SwipeButton
          title={pendingAmount > 0 ? 'Settle Cashback' : 'Nothing to Settle'}
          titleStyles={{color: titleColor, fontSize: 16, fontWeight: '800'}}
          railBackgroundColor="#ff4500"
          railBorderColor="#ff4500"
          height={50}
          railStyles={{
            borderRadius: 26,
            backgroundColor: '#ff450000',
            borderColor: '#ff450000',
          }}
          thumbIconComponent={ThumbIcon}
          thumbIconBackgroundColor="#fff"
          thumbIconBorderColor="#fff"
          thumbIconWidth={46}
          thumbIconStyles={{height: 38, width: 38, borderRadius: 20}}
          onSwipeStart={() => setTitleColor('#e5e7eb')}
          onSwipeSuccess={() => {
            setTitleColor('#FFFFFF');
            setSwiped(true);
            if (pendingAmount > 0) settleNow();
          }}
          onSwipeFail={() => setTitleColor('#FFFFFF')}
          disabled={pendingAmount <= 0}
        />
      </View>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F5F6FA'},

  // Top bar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f3',
  },
  topbarTitle: {fontSize: 18, fontWeight: '900', color: '#0b1220'},

  // Tiles
  tileRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f1f4',
  },
  tileLabel: {fontSize: 12, color: '#6b7280'},
  tileValue: {fontSize: 18, fontWeight: '900', color: '#0b1220', marginTop: 4},

  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#eceff3',
  },
  chipActive: {backgroundColor: '#111827', borderColor: '#111827'},
  chipText: {fontSize: 12, fontWeight: '800', color: '#111827'},
  chipTextActive: {color: '#ffffff'},

  // Section
  sectionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f1f4',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {fontSize: 16, fontWeight: '900', color: '#0b1220'},

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rowIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {fontSize: 14, fontWeight: '900', color: '#111827'},
  rowSub: {fontSize: 12, color: '#6b7280', marginTop: 2},
  rowDate: {fontSize: 11, color: '#9ca3af', marginTop: 2},
  rowAmt: {fontSize: 14, fontWeight: '900', color: '#0b1220', marginLeft: 8},

  emptyText: {fontSize: 12, color: '#6b7280', marginTop: 6},

  // Pills
  pill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {fontSize: 11, fontWeight: '800'},

  // Swipe
  swipeWrap: {position: 'absolute', left: 16, right: 16, bottom: 16},
  thumbContainer: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
