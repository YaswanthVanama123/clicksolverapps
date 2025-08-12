// AdminTrackingDashboardPro.jsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {Calendar} from 'react-native-calendars';
import Svg, {Path, Defs, LinearGradient, Stop} from 'react-native-svg';
import axios from 'axios';

/* ---------------------- Animated Components ---------------------- */

// ✅ Safe Animated Semi-Donut using dashoffset (no 'd' animation)
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ProgressDonut = ({progress = 0, size = 180, stroke = 16}) => {
  const p = Math.max(0, Math.min(1, progress));
  const anim = useRef(new Animated.Value(p)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: p,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [p]);

  // Fixed 180° arc path (left→right through top)
  const w = size;
  const r = (w - stroke) / 2;
  const cx = w / 2;
  const cy = w / 2;
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;
  const d = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
  const arcLen = Math.PI * r; // half circumference

  const dashOffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [arcLen, 0],
  });

  return (
    <Svg width={w} height={w / 2} viewBox={`0 0 ${w} ${w / 2}`}>
      <Path
        d={d}
        stroke="#E5E5E5"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#7B6CFF" />
          <Stop offset="1" stopColor="#FF7A59" />
        </LinearGradient>
      </Defs>
      <AnimatedPath
        d={d}
        stroke="url(#g)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arcLen}, ${arcLen}`}
        strokeDashoffset={dashOffset}
      />
    </Svg>
  );
};

// Animated filling bar (value in [0..1]); label rendered by parent
const FillingBar = ({value = 0}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.max(0, Math.min(1, value)),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.fillWrap}>
      <Animated.View style={[styles.fillBar, {width}]} />
    </View>
  );
};

/* ---------------------- Screen ---------------------- */

const AdminTrackingDashboardPro = ({navigation}) => {
  // UI state
  const [period, setPeriod] = useState('today'); // today | week | month | custom
  const [showPicker, setShowPicker] = useState(false);
  const [startDate, setStartDate] = useState(null); // Date
  const [endDate, setEndDate] = useState(null); // Date

  // Data state
  const [current, setCurrent] = useState(null);
  const [previous, setPrevious] = useState(null);

  // Quick actions
  const quickActions = [
    {
      icon: 'chart-bar',
      label: 'Service Tracking',
      screen: 'AdministratorAllTrackings',
    },
    {
      icon: 'user-check',
      label: 'Worker Approval',
      screen: 'ApprovalPendingItems',
    },
    {icon: 'tag', label: 'Pending Cashback', screen: 'PendingCashbackWorkers'},
    {icon: 'wallet', label: 'Pending Balance', screen: 'PendingBalanceWorkers'},
    {icon: 'search', label: 'Worker Search', screen: 'WorkerDataBySearch'},
    {icon: 'flag', label: 'Signup Stage', screen: 'WorkerStartingStage'},
  ];

  // Greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12)
      return {
        text: 'Good Morning',
        icon: <Ionicons name="sunny" size={18} color="#ff4500" />,
      };
    if (h < 17)
      return {
        text: 'Good Afternoon',
        icon: <Feather name="sunset" size={18} color="#ff4500" />,
      };
    return {
      text: 'Good Evening',
      icon: (
        <MaterialCommunityIcons
          name="weather-night"
          size={18}
          color="#4a4a4a"
        />
      ),
    };
  }, []);

  // Helpers
  const toISO = d =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0];
  const fmt = d => toISO(d);

  const getTodayRange = () => {
    const t = new Date();
    const s = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    return {start: s, end: s};
  };
  const getYesterdayRange = () => {
    const t = new Date();
    const y = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
    return {start: y, end: y};
  };
  const getThisWeekRange = () => {
    const t = new Date();
    const dow = (t.getDay() + 6) % 7; // Monday start
    const start = new Date(t.getFullYear(), t.getMonth(), t.getDate() - dow);
    const end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 6,
    );
    return {start, end};
  };
  const getLastWeekRange = () => {
    const {start} = getThisWeekRange();
    const lastStart = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() - 7,
    );
    const lastEnd = new Date(
      lastStart.getFullYear(),
      lastStart.getMonth(),
      lastStart.getDate() + 6,
    );
    return {start: lastStart, end: lastEnd};
  };
  const getThisMonthRange = () => {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    const end = new Date(t.getFullYear(), t.getMonth() + 1, 0);
    return {start, end};
  };
  const getLastMonthRange = () => {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const end = new Date(t.getFullYear(), t.getMonth(), 0);
    return {start, end};
  };
  const getPrevForCustom = (s, e) => {
    const days = Math.max(1, Math.round((e - s) / 86400000) + 1);
    const prevEnd = new Date(s.getFullYear(), s.getMonth(), s.getDate() - 1);
    const prevStart = new Date(
      prevEnd.getFullYear(),
      prevEnd.getMonth(),
      prevEnd.getDate() - days + 1,
    );
    return {start: prevStart, end: prevEnd};
  };

  // Loader
  const load = async (range, compareRange) => {
    const payloadOf = r =>
      r.start.getTime() === r.end.getTime()
        ? {date: fmt(r.start)}
        : {startDate: fmt(r.start), endDate: fmt(r.end)};
    try {
      const [{data: cur}, {data: prev}] = await Promise.all([
        axios.post(
          'https://backend.clicksolver.com/api/administrator/service/date/details',
          payloadOf(range),
        ),
        axios.post(
          'https://backend.clicksolver.com/api/administrator/service/date/details',
          payloadOf(compareRange),
        ),
      ]);
      setCurrent(cur?.data || null);
      console.log('current data', cur?.data);
      setPrevious(prev?.data || null);
    } catch (e) {
      console.log('load error', e?.message);
      setCurrent(null);
      setPrevious(null);
    }
  };

  // On period change
  useEffect(() => {
    let r, pr;
    if (period === 'today') {
      r = getTodayRange();
      pr = getYesterdayRange();
    } else if (period === 'week') {
      r = getThisWeekRange();
      pr = getLastWeekRange();
    } else if (period === 'month') {
      r = getThisMonthRange();
      pr = getLastMonthRange();
    } else if (period === 'custom' && startDate && endDate) {
      r = {start: startDate, end: endDate};
      pr = getPrevForCustom(startDate, endDate);
    } else {
      return;
    }
    setStartDate(r.start);
    setEndDate(r.end);
    load(r, pr);
  }, [period]);

  // Reload for custom
  useEffect(() => {
    if (period === 'custom' && startDate && endDate) {
      const r = {start: startDate, end: endDate};
      const pr = getPrevForCustom(startDate, endDate);
      load(r, pr);
    }
  }, [startDate, endDate]);

  // Derived
  const curServices = Number(current?.total_services || 0);
  const prevServices = Number(previous?.total_services || 0);
  const changeAbs = curServices - prevServices;
  const changePct =
    prevServices === 0
      ? curServices > 0
        ? 100
        : 0
      : Math.round((changeAbs / prevServices) * 100);
  const ring =
    prevServices === 0
      ? curServices > 0
        ? 1
        : 0
      : Math.min(1, curServices / prevServices);

  const compareLabel = useMemo(() => {
    if (period === 'today') return 'vs Yesterday';
    if (period === 'week') return 'vs Last Week';
    if (period === 'month') return 'vs Last Month';
    return 'vs Previous Range';
  }, [period]);

  // Calendar handlers
  const onPickDay = day => {
    const d = new Date(day.dateString + 'T00:00:00');
    if (!startDate || (startDate && endDate)) {
      setStartDate(d);
      setEndDate(null);
    } else if (startDate && !endDate) {
      d >= startDate ? setEndDate(d) : setStartDate(d);
    }
  };
  const markedDates = () => {
    const md = {};
    const add = (k, o) => (md[k] = {...(md[k] || {}), ...o});
    if (startDate)
      add(fmt(startDate), {
        startingDay: true,
        color: '#ff4500',
        textColor: '#fff',
      });
    if (startDate && endDate) {
      let c = new Date(startDate);
      while (c <= endDate) {
        add(fmt(c), {color: '#ffd7c6', textColor: '#212121'});
        c = new Date(c.getFullYear(), c.getMonth(), c.getDate() + 1);
      }
      add(fmt(endDate), {endingDay: true, color: '#ff4500', textColor: '#fff'});
    }
    return md;
  };

  // Header + segment
  const greetingBar = (
    <View style={styles.header}>
      <View>
        <Text style={styles.hello}>
          {greeting.icon} {greeting.text}
        </Text>
        <Text style={styles.name}>Yaswanth</Text>
      </View>
      <View style={styles.segment}>
        {[
          {k: 'today', t: 'Today'},
          {k: 'week', t: 'Week'},
          {k: 'month', t: 'Month'},
          {k: 'custom', t: 'Dates'},
        ].map(x => (
          <TouchableOpacity
            key={x.k}
            onPress={() =>
              x.k === 'custom' ? setShowPicker(true) : setPeriod(x.k)
            }
            style={[styles.segBtn, period === x.k && styles.segBtnActive]}>
            <Text
              style={[styles.segText, period === x.k && styles.segTextActive]}>
              {x.t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {greetingBar}

        {/* Hero Progress */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>Tracking Progress</Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{compareLabel}</Text>
            </View>
          </View>

          <Text style={styles.heroDesc}>
            {startDate && endDate ? `${fmt(startDate)} → ${fmt(endDate)}` : '—'}
          </Text>

          {/* Animated semi-donut */}
          <View style={{alignItems: 'center', marginTop: 8}}>
            <ProgressDonut progress={ring} size={180} stroke={16} />
            <View style={{position: 'absolute', top: 40, alignItems: 'center'}}>
              <Text style={styles.progressText}>{Math.round(ring * 100)}%</Text>
              <Text style={styles.progressSub}>of last period</Text>
            </View>
          </View>

          {/* Animated filling bar with overlay label */}
          <View style={{marginTop: 10}}>
            <FillingBar value={ring} />
            <View style={styles.fillOverlay}>
              <Ionicons
                name={changeAbs >= 0 ? 'trending-up' : 'trending-down'}
                size={16}
              />
              <Text style={styles.fillText}>
                {`${
                  changeAbs >= 0 ? '+' : ''
                }${changePct}% • ${curServices} vs ${prevServices} services`}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>
            {period === 'today'
              ? 'Today Stats'
              : period === 'week'
              ? 'This Week Stats'
              : period === 'month'
              ? 'This Month Stats'
              : 'Selected Range Stats'}
          </Text>
        </View>

        <View style={styles.grid}>
          <StatCard
            icon={<MaterialCommunityIcons name="clipboard-text" size={20} />}
            label="Services"
            value={current?.total_services || '0'}
          />
          <StatCard
            icon={<MaterialCommunityIcons name="cancel" size={20} />}
            label="Cancels"
            value={current?.total_cancels || '0'}
          />
          <StatCard
            icon={<Ionicons name="cash-outline" size={20} />}
            label="Earnings"
            value={`₹${current?.total_earnings || '0'}`}
          />
          <StatCard
            icon={<Ionicons name="wallet-outline" size={20} />}
            label="Pending Balance"
            value={`₹${current?.total_balance || '0'}`}
          />
          <StatCard
            icon={<MaterialCommunityIcons name="account-group" size={20} />}
            label="Workers"
            value={current?.total_workers || '0'}
          />
          <StatCard
            icon={<Ionicons name="people" size={20} />}
            label="Users"
            value={current?.total_users || '0'}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          {quickActions.map(q => (
            <TouchableOpacity
              key={q.label}
              style={styles.actionBtn}
              onPress={() => navigation?.push?.(q.screen)}>
              <FontAwesome5 name={q.icon} size={18} color="#ff4500" />
              <Text style={styles.actionText}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.calendarCard}>
                <View style={styles.calendarHead}>
                  <Text style={styles.calendarTitle}>Select date range</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setShowPicker(false);
                    }}>
                    <Ionicons name="close" size={20} color="#212121" />
                  </TouchableOpacity>
                </View>

                <Calendar
                  onDayPress={onPickDay}
                  markedDates={markedDates()}
                  markingType="period"
                  theme={{
                    todayTextColor: '#ff4500',
                    arrowColor: '#ff4500',
                    monthTextColor: '#212121',
                  }}
                />

                <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => {
                      setStartDate(null);
                      setEndDate(null);
                    }}>
                    <Text style={styles.secondaryBtnText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      !(startDate && endDate) && {opacity: 0.5},
                    ]}
                    disabled={!(startDate && endDate)}
                    onPress={() => {
                      setPeriod('custom');
                      setShowPicker(false);
                    }}>
                    <Text style={styles.primaryBtnText}>Apply Range</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

/* ---------------------- Small Card ---------------------- */
const StatCard = ({icon, label, value}) => (
  <View style={styles.card}>
    <View style={styles.cardIcon}>{icon}</View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

/* ---------------------- Styles ---------------------- */
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#ffffff'},
  scroll: {paddingBottom: 24},
  header: {paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12},
  hello: {color: '#4a4a4a', fontSize: 13, fontWeight: '600'},
  name: {color: '#212121', fontSize: 18, fontWeight: '800', marginTop: 2},
  segment: {
    marginTop: 12,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 4,
    alignSelf: 'flex-start',
  },
  segBtn: {paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10},
  segBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9e9e9',
  },
  segText: {fontWeight: '600', color: '#4a4a4a'},
  segTextActive: {color: '#212121'},

  hero: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#F4EEFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {color: '#212121', fontSize: 16, fontWeight: '800'},
  pill: {
    backgroundColor: '#212121',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {color: '#fff', fontSize: 12, fontWeight: '700'},
  heroDesc: {color: '#4a4a4a', marginTop: 8, fontSize: 13},

  progressText: {fontSize: 22, fontWeight: '900', color: '#212121'},
  progressSub: {fontSize: 12, color: '#4a4a4a'},

  // Filling bar
  fillWrap: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEFFE0',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fillBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#CFF7A3',
  },
  fillOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fillText: {marginLeft: 6, fontWeight: '700', color: '#212121'},

  sectionHead: {
    marginTop: 18,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {fontSize: 16, fontWeight: '900', color: '#212121'},

  grid: {
    marginTop: 10,
    marginHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    borderWidth: 1,
    borderColor: '#f1f1f1',
  },
  cardIcon: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3ee',
    padding: 8,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardValue: {fontSize: 18, fontWeight: '900', color: '#212121'},
  cardLabel: {fontSize: 12, color: '#4a4a4a', marginTop: 2},

  actionsGrid: {
    marginHorizontal: 20,
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionBtn: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f1f1',
  },
  actionText: {
    marginTop: 8,
    color: '#4a4a4a',
    fontWeight: '700',
    textAlign: 'center',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  calendarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 12,
  },
  calendarHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calendarTitle: {fontSize: 16, fontWeight: '800', color: '#212121'},
  primaryBtn: {
    flex: 1,
    backgroundColor: '#ff4500',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {color: '#fff', fontWeight: '800'},
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {color: '#212121', fontWeight: '800'},
});

export default AdminTrackingDashboardPro;
