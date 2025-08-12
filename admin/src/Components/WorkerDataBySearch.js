// WorkerDataBySearchUltra.jsx
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {SafeAreaView} from 'react-native-safe-area-context';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------- utils ---------- */
const INR = n => {
  const v = Number(n ?? 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `₹${Math.round(v).toLocaleString('en-IN')}`;
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
const fmtDateTime = d => {
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
const safe = v => (v === null || v === undefined ? '—' : String(v));

/* ---------- tiny UI ---------- */
const Pill = ({label, active, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.pill, active && styles.pillActive]}>
    <Text style={[styles.pillText, active && styles.pillTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);
const StatChip = ({icon, label, value}) => (
  <View style={styles.statChip}>
    <View style={styles.statIcon}>{icon}</View>
    <View style={{flex: 1}}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);
const Row = ({left, right}) => (
  <View style={styles.row}>
    <Text style={styles.rowLeft} numberOfLines={1}>
      {left}
    </Text>
    <Text style={styles.rowRight} numberOfLines={1}>
      {right}
    </Text>
  </View>
);

const SectionCard = ({title, open, onToggle, children}) => (
  <View style={styles.section}>
    <TouchableOpacity
      style={styles.sectionHead}
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggle?.();
      }}>
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

/* ---------- screen ---------- */
export default function WorkerDataBySearchUltra() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loadingWorker, setLoadingWorker] = useState(false);
  const [error, setError] = useState('');
  const [worker, setWorker] = useState(null);

  // tabs
  const tabs = useMemo(
    () => [
      {key: 'cashback', label: 'Cashback'},
      {key: 'balance', label: 'Balance'},
      {key: 'service', label: 'Services'},
      {key: 'current', label: 'Current'},
    ],
    [],
  );
  const [tab, setTab] = useState('');
  const [tabData, setTabData] = useState(null);
  const [loadingTab, setLoadingTab] = useState(false);

  // accordions
  const [openAddress, setOpenAddress] = useState(false);
  const [openPersonal, setOpenPersonal] = useState(false);

  // current screen editor
  const [screenName, setScreenName] = useState('');
  const [params, setParams] = useState('');

  // header anim
  const headAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headAnim]);
  const headStyle = {
    opacity: headAnim,
    transform: [
      {
        translateY: headAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  // pill indicator anim
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [pillWidths, setPillWidths] = useState([]);
  const [pillXs, setPillXs] = useState([]);
  const onMeasurePill = (i, e) => {
    const {x, width} = e.nativeEvent.layout;
    setPillWidths(prev => {
      const copy = [...prev];
      copy[i] = width;
      return copy;
    });
    setPillXs(prev => {
      const copy = [...prev];
      copy[i] = x;
      return copy;
    });
  };
  useEffect(() => {
    const idx = Math.max(
      0,
      tabs.findIndex(t => t.key === tab),
    );
    if (pillXs[idx] !== undefined) {
      Animated.spring(indicatorX, {
        toValue: pillXs[idx],
        useNativeDriver: true,
        bounciness: 8,
      }).start();
    }
  }, [tab, pillXs, indicatorX, tabs]);

  /* ---------- actions ---------- */
  const searchWorker = async () => {
    setError('');
    setWorker(null);
    setTab('');
    setTabData(null);
    setOpenAddress(false);
    setOpenPersonal(false);

    if (!phoneNumber.trim()) {
      setError('Please enter a phone number.');
      return;
    }
    setLoadingWorker(true);
    try {
      const res = await axios.get(
        'https://backend.clicksolver.com/api/worker/search',
        {
          params: {phone_number: phoneNumber.trim()},
        },
      );
      if (!res?.data || Object.keys(res.data).length === 0) {
        setError('No data found.');
      } else {
        setWorker(res.data);
      }
    } catch (e) {
      setError('No data found.');
    } finally {
      setLoadingWorker(false);
    }
  };

  const fetchTab = async key => {
    if (!worker) return;
    setLoadingTab(true);
    setTabData(null);
    try {
      let endpoint = '';
      switch (key) {
        case 'cashback':
          endpoint =
            'https://backend.clicksolver.com/api/worker/cashback/history';
          break;
        case 'balance':
          endpoint =
            'https://backend.clicksolver.com/api/worker/balance/history';
          break;
        case 'service':
          endpoint =
            'https://backend.clicksolver.com/api/worker/service/history';
          break;
        case 'current':
          endpoint =
            'https://backend.clicksolver.com/api/worker/current/service';
          break;
      }
      const res = await axios.get(endpoint, {
        params: {worker_id: worker.worker_id},
      });
      let payload = res?.data;

      if (key === 'service' && Array.isArray(payload)) {
        payload = [...payload].sort(
          (a, b) => new Date(b.end_time) - new Date(a.end_time),
        );
      }
      setTabData(payload);

      if (key === 'current') {
        setScreenName(payload?.screen_name || '');
        setParams(payload?.params || '');
      }
    } catch (e) {
      setError('Error fetching data for this section.');
    } finally {
      setLoadingTab(false);
    }
  };

  const onPressTab = key => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTab(key);
    fetchTab(key);
  };

  const saveCurrentScreen = async () => {
    if (!worker) return;
    try {
      await axios.post(
        'https://backend.clicksolver.com/api/worker/screen/change',
        {
          worker_id: worker.worker_id,
          screen: screenName,
          params,
        },
      );
      alert('Screen details updated.');
    } catch {
      alert('Error updating screen.');
    }
  };

  /* ---------- derived ---------- */
  const subservicesStr = useMemo(() => {
    const raw = worker?.subservices;
    if (!raw) return '—';
    const arr = Array.isArray(raw) ? raw : [];
    const items = arr
      .map(x => (typeof x === 'string' ? x : x?.name || ''))
      .filter(Boolean);
    const s = items.slice(0, 5).join(', ');
    return items.length > 5 ? `${s}…` : s || '—';
  }, [worker]);

  /* ---------- tab sections (no FlatLists inside ScrollView) ---------- */
  const CashbackSection = () => {
    const approved = tabData?.cashback_approved_times ?? 0;
    const gain = Number(tabData?.cashback_gain ?? 0) * 100;
    const hist = Array.isArray(tabData?.cashback_history)
      ? tabData.cashback_history
      : [];
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cashback Summary</Text>
        <View style={styles.inlineStats}>
          <StatChip
            icon={
              <MaterialCommunityIcons
                name="check-decagram"
                size={16}
                color="#fff"
              />
            }
            label="Approved"
            value={safe(approved)}
          />
          <StatChip
            icon={<MaterialCommunityIcons name="cash" size={16} color="#fff" />}
            label="Gain"
            value={INR(gain)}
          />
        </View>
        <View style={styles.divider} />
        <Text style={styles.cardTitleSmall}>History</Text>
        {hist.length === 0 ? (
          <Text style={styles.muted}>No data found.</Text>
        ) : (
          hist.map((it, i) => (
            <View key={`cb_${i}`} style={styles.itemRow}>
              <View style={[styles.itemIcon, {backgroundColor: '#8b5cf6'}]}>
                <MaterialCommunityIcons
                  name="cash-refund"
                  size={18}
                  color="#fff"
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.itemTitle}>
                  Amount: {INR(it?.amount ?? 0)}
                </Text>
                <Text style={styles.itemSub}>Type: {safe(it?.paid)}</Text>
              </View>
              <Text style={styles.itemRight}>{fmtDateTime(it?.time)}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const BalanceSection = () => {
    const arr = Array.isArray(tabData) ? tabData : [];
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Balance History</Text>
        {arr.length === 0 ? (
          <Text style={styles.muted}>No data found.</Text>
        ) : (
          arr.map((it, i) => (
            <View key={`bal_${i}`} style={styles.itemRow}>
              <View style={[styles.itemIcon, {backgroundColor: '#0ea5e9'}]}>
                <MaterialCommunityIcons
                  name="bank-transfer"
                  size={18}
                  color="#fff"
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.itemTitle}>
                  Payment: {INR(it?.payment ?? 0)}
                </Text>
                <Text style={styles.itemSub}>
                  Type: {safe(it?.payment_type)}
                </Text>
              </View>
              <Text style={styles.itemRight}>{fmtDateTime(it?.end_time)}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const ServiceSection = () => {
    const arr = Array.isArray(tabData) ? tabData : [];
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service History</Text>
        {arr.length === 0 ? (
          <Text style={styles.muted}>No data found.</Text>
        ) : (
          arr.map((it, i) => (
            <View key={`svc_${i}`} style={styles.itemRow}>
              <View style={[styles.itemIcon, {backgroundColor: '#10b981'}]}>
                <MaterialCommunityIcons
                  name="briefcase-check"
                  size={18}
                  color="#fff"
                />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.itemTitle}>
                  Payment: {INR(it?.payment ?? 0)}
                </Text>
                <Text style={styles.itemSub}>
                  Type: {safe(it?.payment_type)}
                </Text>
              </View>
              <Text style={styles.itemRight}>{fmtDateTime(it?.end_time)}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const CurrentSection = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Current Screen</Text>
      <Text style={styles.inputLabel}>Screen Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter screen name"
        placeholderTextColor="#9ca3af"
        value={screenName}
        onChangeText={setScreenName}
      />
      <Text style={styles.inputLabel}>Params</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter params"
        placeholderTextColor="#9ca3af"
        value={params}
        onChangeText={setParams}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={saveCurrentScreen}>
        <Text style={styles.primaryBtnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={styles.safe}>
      {/* Gradient-ish header */}
      <Animated.View style={[styles.header, headStyle]}>
        <Text style={styles.headerTitle}>Find Worker</Text>
        <Text style={styles.headerSub}>Search by phone number</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={{paddingBottom: 24}}>
        {/* Search box */}
        <View style={styles.searchWrap}>
          <View style={styles.phoneBox}>
            <View style={styles.ccWrap}>
              <Text style={styles.ccText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="98765 43210"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              returnKeyType="search"
              onSubmitEditing={searchWorker}
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={searchWorker}
              activeOpacity={0.9}>
              <FontAwesome5 name="search" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          {loadingWorker && (
            <ActivityIndicator
              size="small"
              color="#FF5722"
              style={{marginTop: 10}}
            />
          )}
        </View>

        {/* Result */}
        {worker ? (
          <>
            {/* Hero card */}
            <View style={styles.heroCard}>
              <Image
                source={{
                  uri: worker.profile || 'https://i.pravatar.cc/120?img=11',
                }}
                style={styles.avatar}
              />
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.name} numberOfLines={1}>
                  {safe(worker.name)}
                </Text>
                <Text style={styles.role} numberOfLines={1}>
                  {safe(worker.service)}
                </Text>
                <Text style={styles.meta}>ID: {safe(worker.worker_id)}</Text>
                {!!worker.created_at && (
                  <Text style={styles.meta}>
                    Joined: {fmtDate(worker.created_at)}
                  </Text>
                )}
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {worker.average_rating ?? '—'}★
                </Text>
              </View>
            </View>

            {/* Stat chips */}
            <View style={styles.statRow}>
              <StatChip
                icon={
                  <MaterialCommunityIcons
                    name="cash-100"
                    size={16}
                    color="#fff"
                  />
                }
                label="Earned"
                value={INR(worker.money_earned ?? 0)}
              />
              <StatChip
                icon={
                  <MaterialCommunityIcons name="bank" size={16} color="#fff" />
                }
                label="Balance"
                value={INR(worker.balance_amount ?? 0)}
              />
            </View>
            <View style={styles.statRow}>
              <StatChip
                icon={
                  <MaterialCommunityIcons
                    name="briefcase"
                    size={16}
                    color="#fff"
                  />
                }
                label="Services"
                value={safe(worker.service_counts)}
              />
              <StatChip
                icon={
                  <MaterialCommunityIcons
                    name="format-list-bulleted"
                    size={16}
                    color="#fff"
                  />
                }
                label="Subservices"
                value={subservicesStr}
              />
            </View>

            {/* Overview */}
            <View className="card" style={styles.card}>
              <Text style={styles.cardTitle}>Overview</Text>
              <Row left="Email" right={safe(worker.email)} />
              <Row left="Mobile" right={safe(worker.phone_number)} />
              <Row left="Category" right={safe(worker.service)} />
            </View>

            {/* Accordions */}
            <SectionCard
              title="Address"
              open={openAddress}
              onToggle={() => setOpenAddress(v => !v)}>
              {worker.address ? (
                <>
                  <Row left="Door No" right={safe(worker.address.doorNo)} />
                  <Row left="Landmark" right={safe(worker.address.landmark)} />
                  <Row left="City" right={safe(worker.address.city)} />
                  <Row left="District" right={safe(worker.address.district)} />
                  <Row left="State" right={safe(worker.address.state)} />
                  <Row left="Pincode" right={safe(worker.address.pincode)} />
                </>
              ) : (
                <Text style={styles.muted}>No address available</Text>
              )}
            </SectionCard>

            <SectionCard
              title="Personal Details"
              open={openPersonal}
              onToggle={() => setOpenPersonal(v => !v)}>
              <Row
                left="First name"
                right={safe(worker.personaldetails?.firstName)}
              />
              <Row
                left="Last name"
                right={safe(worker.personaldetails?.lastName)}
              />
              <Row left="Gender" right={safe(worker.personaldetails?.gender)} />
              <Row
                left="Education"
                right={safe(worker.personaldetails?.education)}
              />
              <Row
                left="Work Exp (yrs)"
                right={safe(worker.personaldetails?.workExperience)}
              />
              <Row left="DOB" right={safe(worker.personaldetails?.dob)} />
            </SectionCard>

            {/* Tabs */}
            <View style={styles.tabsWrap}>
              <View style={styles.tabsInner}>
                {tabs.map((t, idx) => (
                  <View
                    key={t.key}
                    onLayout={e => onMeasurePill(idx, e)}
                    style={{flex: 1}}>
                    <Pill
                      label={t.label}
                      active={tab === t.key}
                      onPress={() => onPressTab(t.key)}
                    />
                  </View>
                ))}
                {/* animated underline */}
                {pillXs.length === tabs.length && (
                  <Animated.View
                    style={[
                      styles.tabIndicator,
                      {
                        width:
                          pillWidths[
                            Math.max(
                              0,
                              tabs.findIndex(x => x.key === tab),
                            )
                          ] || 0,
                        transform: [{translateX: indicatorX}],
                      },
                    ]}
                  />
                )}
              </View>
              {loadingTab && (
                <ActivityIndicator
                  size="small"
                  color="#FF5722"
                  style={{marginTop: 10}}
                />
              )}
            </View>

            {/* Tab content (mapped, not FlatList) */}
            {!loadingTab && tab === 'cashback' && tabData && (
              <CashbackSection />
            )}
            {!loadingTab && tab === 'balance' && tabData && <BalanceSection />}
            {!loadingTab && tab === 'service' && tabData && <ServiceSection />}
            {!loadingTab && tab === 'current' && <CurrentSection />}
          </>
        ) : (
          !loadingWorker &&
          !error && (
            <Text style={styles.placeholder}>
              Search a phone number to see worker details.
            </Text>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7FB'},

  header: {
    backgroundColor: '#111827',
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  headerTitle: {color: '#fff', fontSize: 20, fontWeight: '900'},
  headerSub: {color: '#cbd5e1', fontSize: 12, marginTop: 4},

  searchWrap: {paddingHorizontal: 16},
  phoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#eceff3',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  ccWrap: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ccText: {color: '#fff', fontWeight: '800', fontSize: 12},
  phoneInput: {flex: 1, paddingHorizontal: 10, color: '#111827'},
  searchBtn: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {color: '#ef4444', marginTop: 8},
  placeholder: {textAlign: 'center', color: '#9ca3af', marginTop: 20},

  heroCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef0f3',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 2,
  },
  avatar: {width: 64, height: 64, borderRadius: 14, backgroundColor: '#e5e7eb'},
  name: {fontSize: 16, fontWeight: '900', color: '#0b1220'},
  role: {fontSize: 12, color: '#6b7280', marginTop: 2},
  meta: {fontSize: 11, color: '#9ca3af', marginTop: 2},
  badge: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {color: '#fff', fontWeight: '900', fontSize: 12},

  statRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: '#eceff3',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 1,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {fontSize: 11, color: '#6b7280'},
  statValue: {fontSize: 15, fontWeight: '900', color: '#111827', marginTop: 3},

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eceff3',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0b1220',
    marginBottom: 8,
  },
  cardTitleSmall: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLeft: {fontSize: 13, color: '#6b7280', flex: 1, paddingRight: 8},
  rowRight: {fontSize: 13, color: '#111827', flex: 1, textAlign: 'right'},

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eceff3',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {fontSize: 16, fontWeight: '900', color: '#0b1220'},
  muted: {fontSize: 12, color: '#9ca3af'},

  tabsWrap: {marginTop: 16, marginHorizontal: 16},
  tabsInner: {
    flexDirection: 'row',
    backgroundColor: '#EDEEF3',
    borderRadius: 999,
    padding: 4,
    position: 'relative',
  },
  pill: {flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999},
  pillActive: {backgroundColor: '#111827'},
  pillText: {fontSize: 12, fontWeight: '800', color: '#111827'},
  pillTextActive: {color: '#fff'},
  tabIndicator: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#FF5722',
    bottom: 0,
    borderRadius: 1,
  },

  inlineStats: {flexDirection: 'row', gap: 10},

  divider: {height: 1, backgroundColor: '#f0f0f0', marginVertical: 10},

  itemRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    marginRight: 10,
  },
  itemTitle: {fontSize: 13, fontWeight: '800', color: '#111827'},
  itemSub: {fontSize: 12, color: '#6b7280', marginTop: 2},
  itemRight: {fontSize: 11, color: '#9ca3af', marginLeft: 8},

  inputLabel: {fontSize: 12, color: '#6b7280', marginTop: 6, marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 10,
    color: '#111827',
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {color: '#fff', fontWeight: '900'},
});
