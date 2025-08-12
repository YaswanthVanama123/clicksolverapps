// WorkerPendingBalancePro.jsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  Animated,
  Easing,
  LayoutAnimation,
  UIManager,
  Platform,
  Linking,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SwipeButton from 'rn-swipe-button';
import axios from 'axios';
import {useRoute, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------------- Utils ---------------- */
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

/* ---------------- Small UI ---------------- */
const KPI = ({label, value, tone = 'neutral'}) => {
  const tones = {
    neutral: {bg: '#F3F4F6', fg: '#111827'},
    warn: {bg: '#FEF3C7', fg: '#92400E'},
    ok: {bg: '#DCFCE7', fg: '#166534'},
  }[tone];
  return (
    <View style={[styles.kpi, {backgroundColor: tones.bg}]}>
      <Text style={[styles.kpiLabel, {color: '#6b7280'}]}>{label}</Text>
      <Text style={[styles.kpiValue, {color: tones.fg}]}>{value}</Text>
    </View>
  );
};

const LineRow = ({icon, tint, title, subtitle, rightTop, rightBottom}) => (
  <View style={styles.lineRow}>
    <View style={[styles.lineIconWrap, {backgroundColor: tint || '#111827'}]}>
      {icon}
    </View>
    <View style={{flex: 1}}>
      <Text style={styles.lineTitle} numberOfLines={1}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={styles.lineSub} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
    <View style={{alignItems: 'flex-end'}}>
      {!!rightTop && <Text style={styles.lineRightTop}>{rightTop}</Text>}
      {!!rightBottom && (
        <Text style={styles.lineRightBottom}>{rightBottom}</Text>
      )}
    </View>
  </View>
);

const SectionCard = ({title, open, onToggle, children}) => (
  <View style={styles.section}>
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
    {open ? <View style={{marginTop: 10}}>{children}</View> : null}
  </View>
);

/* ---------------- Screen ---------------- */
export default function WorkerPendingBalancePro() {
  const navigation = useNavigation();
  const {serviceData} = useRoute().params; // {worker_id, profile, name, service, balance_amount}
  const {worker_id, profile, name, service, balance_amount} = serviceData;

  // data
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pending, setPending] = useState(Number(balance_amount) || 0);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [cashbackHistory, setCashbackHistory] = useState([]);

  // ui
  const [tab, setTab] = useState('Overview');
  const [openService, setOpenService] = useState(true);
  const [openPayments, setOpenPayments] = useState(false);
  const [openCashback, setOpenCashback] = useState(false);

  // message
  const [message, setMessage] = useState(
    `Hi ${name}, your balance of ${INR(
      balance_amount,
    )} needs to be paid. Please pay soon to continue receiving services from Click Solver.`,
  );

  // settle
  const [amountInput, setAmountInput] = useState('');
  const targetAmount = useMemo(() => {
    const v = Number(amountInput);
    return Number.isFinite(v) && v > 0 ? Math.min(v, pending) : pending;
  }, [amountInput, pending]);

  // animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayAmt, setDisplayAmt] = useState(0);
  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const animateCount = useCallback(
    to => {
      countAnim.stopAnimation();
      Animated.timing(countAnim, {
        toValue: to,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [countAnim],
  );

  useEffect(() => {
    const id = countAnim.addListener(({value}) =>
      setDisplayAmt(Math.round(value)),
    );
    animateCount(Number(balance_amount) || 0);
    return () => countAnim.removeListener(id);
  }, [countAnim, balance_amount, animateCount]);

  // fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.post(
          'https://backend.clicksolver.com/api/worker/pending/balance',
          {worker_id},
        );
        const arr = Array.isArray(res?.data) ? res.data : [];
        const first = arr[0] || {};

        const svc = arr.map((tx, idx) => {
          const type = String(tx?.payment_type || '').toLowerCase();
          const val = Number(tx?.payment || 0);
          const delta = type === 'cash' ? -(val * 0.12) : +(val * 0.88);
          return {
            key: `svc_${idx}`,
            payment: type === 'cash' ? 'Paid by Cash' : 'Paid to Click Solver',
            name: tx?.name || '—',
            amountText: `${delta >= 0 ? '+' : '−'} ${INR(Math.abs(delta))}`,
            time: fmtDate(tx?.end_time),
            positive: delta >= 0,
          };
        });

        setServiceHistory(svc);
        setPaymentHistory(
          Array.isArray(first?.payment_history) ? first.payment_history : [],
        );
        const cb = Array.isArray(first?.cashback_history)
          ? first.cashback_history
          : [];
        setCashbackHistory(
          cb.map((x, i) => ({
            key: `cb_${i}`,
            amountText: INR(Number(x?.amount ?? 0)),
            time: fmtDate(x?.time),
          })),
        );
        if (first?.phone_number) setPhoneNumber(first.phone_number);
      } catch (e) {
        console.log('fetch error', e?.message);
        Alert.alert('Error', 'Failed to fetch worker balance data.');
      }
    };
    fetchData();
  }, [worker_id]);

  /* ------ actions ------ */
  const notifyWorker = useCallback(async () => {
    try {
      await axios.post('https://backend.clicksolver.com/api/worker/message', {
        worker_id,
        message,
      });
      Alert.alert('Sent', 'Message submitted to worker.');
    } catch (e) {
      console.log('msg error', e?.message);
      Alert.alert('Failed', 'Could not send your message.');
    }
  }, [worker_id, message]);

  const settleNow = useCallback(async () => {
    try {
      await axios.post(
        'https://backend.clicksolver.com/api/worker/balance/settled',
        {
          worker_id,
          amount: targetAmount,
        },
      );
      Alert.alert('Settled', `Collected ${INR(targetAmount)} successfully.`);
      const newVal = Math.max(0, pending - targetAmount);
      setPending(newVal);
      animateCount(newVal);
      setAmountInput('');
      setSwiped(false);
    } catch (e) {
      console.log('settle error', e?.message);
      Alert.alert('Failed', 'Could not settle balance. Try again.');
    }
  }, [worker_id, pending, targetAmount, animateCount]);

  const setQuick = ratio => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAmountInput(String(Math.round(pending * ratio)));
  };

  const callPhone = () => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:+91${phoneNumber}`).catch(() =>
      Alert.alert('Cannot open dialer'),
    );
  };
  const openWhatsApp = () => {
    if (!phoneNumber) return;
    const url = `whatsapp://send?phone=+91${phoneNumber}&text=${encodeURIComponent(
      message,
    )}`;
    Linking.openURL(url).catch(() => Alert.alert('WhatsApp not available'));
  };

  const headerStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  /* ------ Tabs content ------ */
  const OverviewTab = (
    <>
      <View style={styles.kpiRow}>
        <KPI label="Pending" value={INR(displayAmt)} tone="warn" />
        <KPI label="Worker" value={name} />
        <KPI label="Category" value={service} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reminder Message</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Type your message..."
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          value={message}
          onChangeText={setMessage}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 10,
          }}>
          <TouchableOpacity
            style={[styles.btn, {backgroundColor: '#111827'}]}
            onPress={notifyWorker}>
            <Text style={styles.btnText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, {backgroundColor: '#25D366'}]}
            onPress={openWhatsApp}>
            <Text style={styles.btnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const HistoryTab = (
    <>
      <SectionCard
        title="Service Charge History"
        open={openService}
        onToggle={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpenService(v => !v);
        }}>
        {serviceHistory.length === 0 ? (
          <Text style={styles.emptyText}>No service charges found.</Text>
        ) : (
          serviceHistory.map(it => (
            <LineRow
              key={it.key}
              icon={
                it.positive ? (
                  <MaterialCommunityIcons
                    name="bank-transfer-in"
                    size={18}
                    color="#fff"
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="bank-transfer-out"
                    size={18}
                    color="#fff"
                  />
                )
              }
              tint={it.positive ? '#16a34a' : '#ef4444'}
              title={it.payment}
              subtitle={`${it.name} • ${it.time}`}
              rightTop={it.amountText}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Payment History"
        open={openPayments}
        onToggle={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpenPayments(v => !v);
        }}>
        {!paymentHistory || paymentHistory.length === 0 ? (
          <Text style={styles.emptyText}>No payments recorded.</Text>
        ) : (
          paymentHistory.map((it, idx) => (
            <LineRow
              key={`pay_${idx}`}
              icon={
                <MaterialCommunityIcons
                  name={it.debited ? 'arrow-top-right' : 'arrow-bottom-left'}
                  size={18}
                  color="#fff"
                />
              }
              tint={it.debited ? '#ef4444' : '#16a34a'}
              title={it.type || (it.debited ? 'Paid to' : 'Received from')}
              subtitle={`Click Solver • ${fmtDate(it.date)}`}
              rightTop={INR(Number(it.amount ?? 0))}
            />
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Cashback History"
        open={openCashback}
        onToggle={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpenCashback(v => !v);
        }}>
        {cashbackHistory.length === 0 ? (
          <Text style={styles.emptyText}>No cashback entries.</Text>
        ) : (
          cashbackHistory.map(it => (
            <LineRow
              key={it.key}
              icon={
                <MaterialCommunityIcons
                  name="cash-refund"
                  size={18}
                  color="#fff"
                />
              }
              tint="#8b5cf6"
              title="Cashback paid"
              subtitle={`Click Solver • ${it.time}`}
              rightTop={it.amountText}
            />
          ))
        )}
      </SectionCard>
    </>
  );

  const SettleTab = (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Settle Balance</Text>
      <Text style={styles.subtle}>Quick amounts</Text>
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => setQuick(0.25)}>
          <Text style={styles.quickChipText}>25%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => setQuick(0.5)}>
          <Text style={styles.quickChipText}>50%</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickChip} onPress={() => setQuick(1)}>
          <Text style={styles.quickChipText}>100%</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Amount</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="numeric"
          placeholder={INR(pending)}
          placeholderTextColor="#9ca3af"
          value={amountInput}
          onChangeText={setAmountInput}
        />
      </View>
      <Text style={styles.toCollectText}>
        To collect now:{' '}
        <Text style={styles.toCollectStrong}>{INR(targetAmount)}</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} pointerEvents="box-none">
      {/* Decorative header + topbar */}
      <View style={styles.heroBg} pointerEvents="none" />
      <Animated.View style={[styles.topbar, headerStyle]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <FontAwesome6 name="arrow-left-long" size={18} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Worker Balance</Text>
        <View style={{width: 18}} />
      </Animated.View>

      {/* Hero summary card */}
      <View style={styles.heroCard}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
          <Image
            source={{uri: profile || 'https://i.pravatar.cc/100?img=12'}}
            style={styles.avatar}
          />
          <View style={{flex: 1}}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.heroSub} numberOfLines={1}>
              {service}
            </Text>
            {!!phoneNumber && (
              <Text style={styles.heroPhone}>+91 {phoneNumber}</Text>
            )}
          </View>
          <View style={{gap: 8}}>
            <TouchableOpacity
              style={[styles.quickBtn, {backgroundColor: '#10b981'}]}
              onPress={callPhone}>
              <MaterialCommunityIcons name="phone" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, {backgroundColor: '#25D366'}]}
              onPress={openWhatsApp}>
              <MaterialCommunityIcons name="whatsapp" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroBottomRow}>
          <View>
            <Text style={styles.heroLabel}>Pending Balance</Text>
            <Text style={styles.heroAmount}>{INR(displayAmt)}</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>To Collect</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['Overview', 'History', 'Settle'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{paddingBottom: 120}}
        pointerEvents="box-none">
        {tab === 'Overview' && OverviewTab}
        {tab === 'History' && HistoryTab}
        {tab === 'Settle' && SettleTab}
      </ScrollView>

      {/* Swipe to confirm (always on top) */}
      <View style={styles.swipeWrap} pointerEvents="auto">
        <SwipeButton
          title={
            pending > 0
              ? tab === 'Settle'
                ? 'Collect & Settle'
                : 'Collect Pending'
              : 'Nothing to Collect'
          }
          titleStyles={{color: titleColor, fontSize: 16, fontWeight: '800'}}
          containerStyles={{borderRadius: 26}} // ensures tappable width & shape
          height={50}
          railBackgroundColor="#ff4500"
          railBorderColor="#ff4500"
          railStyles={{
            borderRadius: 26,
            backgroundColor: '#ff450000',
            borderColor: '#ff450000',
          }}
          railFillBackgroundColor="#fff" // visible fill track
          railFillBorderColor="#fff"
          thumbIconComponent={() => (
            <View style={styles.thumbContainer}>
              {swiped ? (
                <Entypo name="check" size={20} color="#ff4500" />
              ) : (
                <FontAwesome6
                  name="arrow-right-long"
                  size={18}
                  color="#ff4500"
                />
              )}
            </View>
          )}
          thumbIconBackgroundColor="#fff"
          thumbIconBorderColor="#fff"
          thumbIconWidth={46}
          thumbIconStyles={{height: 38, width: 38, borderRadius: 20}}
          onSwipeStart={() => setTitleColor('#e5e7eb')}
          onSwipeSuccess={() => {
            setTitleColor('#FFFFFF');
            setSwiped(true);
            if (pending > 0) settleNow();
          }}
          onSwipeFail={() => setTitleColor('#FFFFFF')}
          shouldResetAfterSuccess={true} // IMPORTANT for Android
          resetAfterSuccessAnimDelay={900}
          disabled={pending <= 0}
        />
      </View>
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7FB'},

  heroBg: {height: 130, backgroundColor: '#111827'},

  topbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topbarTitle: {fontSize: 18, fontWeight: '900', color: '#ffffff'},

  heroCard: {
    marginHorizontal: 16,
    marginTop: -60,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eef0f3',
  },
  avatar: {width: 56, height: 56, borderRadius: 14, backgroundColor: '#e5e7eb'},
  name: {fontSize: 16, fontWeight: '900', color: '#0b1220'},
  heroSub: {fontSize: 12, color: '#6b7280', marginTop: 2},
  heroPhone: {fontSize: 11, color: '#9ca3af', marginTop: 2},
  heroDivider: {height: 1, backgroundColor: '#eef0f3', marginVertical: 12},
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {fontSize: 12, color: '#6b7280'},
  heroAmount: {fontSize: 22, fontWeight: '900', color: '#0b1220', marginTop: 2},
  heroPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroPillText: {fontSize: 11, fontWeight: '900', color: '#92400E'},

  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#EDEEF3',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {backgroundColor: '#111827'},
  tabText: {color: '#111827', fontWeight: '800', fontSize: 12},
  tabTextActive: {color: '#ffffff'},

  kpiRow: {flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 8},
  kpi: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eceff3',
  },
  kpiLabel: {fontSize: 11},
  kpiValue: {fontSize: 16, fontWeight: '900', marginTop: 4},

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eceff3',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0b1220',
    marginBottom: 8,
  },
  textarea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    color: '#111827',
  },

  btn: {paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10},
  btnText: {color: '#fff', fontWeight: '900'},

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
    borderWidth: 1,
    borderColor: '#eceff3',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {fontSize: 16, fontWeight: '900', color: '#0b1220'},

  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  lineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineTitle: {fontSize: 14, fontWeight: '900', color: '#111827'},
  lineSub: {fontSize: 12, color: '#6b7280', marginTop: 2},
  lineRightTop: {fontSize: 13, fontWeight: '900', color: '#0b1220'},
  lineRightBottom: {fontSize: 11, color: '#9ca3af'},

  quickRow: {flexDirection: 'row', gap: 8, marginTop: 8},
  quickChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#eceff3',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  quickChipText: {fontSize: 12, fontWeight: '800', color: '#111827'},
  amountRow: {flexDirection: 'row', alignItems: 'center', marginTop: 12},
  amountLabel: {width: 70, fontSize: 13, color: '#6b7280'},
  amountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
  toCollectText: {marginTop: 10, fontSize: 13, color: '#6b7280'},
  toCollectStrong: {color: '#0b1220', fontWeight: '900'},

  quickBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Swipe — ensure it is topmost & clickable
  swipeWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 9999,
    elevation: 8,
  },

  emptyText: {fontSize: 12, color: '#6b7280'},
});
