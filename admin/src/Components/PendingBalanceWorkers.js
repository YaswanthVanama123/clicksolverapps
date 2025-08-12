// PendingBalanceWorkers.jsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

/* ------------- Helpers ------------- */
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
const toNum = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const useRowAnim = index => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 420,
      delay: index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [a, index]);
  return {
    opacity: a,
    transform: [
      {translateY: a.interpolate({inputRange: [0, 1], outputRange: [10, 0]})},
    ],
  };
};

/* ------------- Screen ------------- */
const PendingBalanceWorkers = () => {
  const navigation = useNavigation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI filters
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState('All'); // All | Positive | Negative
  const [sort, setSort] = useState('Amount'); // Amount | Recent

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        'https://backend.clicksolver.com/api/pending/balance/workers',
      );
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
    } catch (e) {
      console.log('pending balance fetch error', e?.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  /* -------- Derived totals / list -------- */
  const summary = useMemo(() => {
    const totalPositive = rows.reduce((acc, r) => {
      const val = toNum(r?.balance_amount);
      return acc + (val > 0 ? val : 0);
    }, 0);
    const totalNegative = rows.reduce((acc, r) => {
      const val = toNum(r?.balance_amount);
      return acc + (val < 0 ? Math.abs(val) : 0);
    }, 0);
    return {count: rows.length, totalPositive, totalNegative};
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = rows.filter(r => {
      const name = String(r?.name ?? '').toLowerCase();
      const service = String(r?.service ?? '').toLowerCase();
      const passText = !q || name.includes(q) || service.includes(q);

      const bal = toNum(r?.balance_amount);
      const passChip =
        chip === 'All' ||
        (chip === 'Positive' && bal > 0) ||
        (chip === 'Negative' && bal < 0);

      return passText && passChip;
    });

    if (sort === 'Amount') {
      arr = arr
        .slice()
        .sort((a, b) => toNum(b?.balance_amount) - toNum(a?.balance_amount));
    } else if (sort === 'Recent') {
      arr = arr
        .slice()
        .sort((a, b) => new Date(b?.created_at) - new Date(a?.created_at));
    }
    return arr;
  }, [rows, query, chip, sort]);

  /* -------- Actions -------- */
  const sendNotifications = async list => {
    const workerIds = list.map(i => i?.worker_id).filter(Boolean);
    try {
      await axios.post(
        'https://backend.clicksolver.com/api/send/notifications',
        {worker_ids: workerIds},
      );
    } catch (e) {
      console.log('notify error', e?.message);
    }
  };

  /* -------- Header -------- */
  const ListHeader = (
    <>
      {/* Top bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={22} color="#0b1220" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Balance (Workers)</Text>
        <TouchableOpacity onPress={fetchData}>
          <Icon name="refresh" size={22} color="#0b1220" />
        </TouchableOpacity>
      </View>

      {/* Tiles */}
      <View style={styles.tiles}>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Workers</Text>
          <Text style={styles.tileValue}>{summary.count}</Text>
          <View style={[styles.badge, {borderColor: '#0ea5e9'}]}>
            <Text style={[styles.badgeText, {color: '#0ea5e9'}]}>Active</Text>
          </View>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Receivable (₹)</Text>
          <Text style={styles.tileValue}>{INR(summary.totalPositive)}</Text>
          <View style={[styles.badge, {borderColor: '#16a34a'}]}>
            <Text style={[styles.badgeText, {color: '#16a34a'}]}>
              Owed to Us
            </Text>
          </View>
        </View>
        <View style={styles.tile}>
          <Text style={styles.tileLabel}>Credits (₹)</Text>
          <Text style={styles.tileValue}>{INR(summary.totalNegative)}</Text>
          <View style={[styles.badge, {borderColor: '#ef4444'}]}>
            <Text style={[styles.badgeText, {color: '#ef4444'}]}>We Owe</Text>
          </View>
        </View>
      </View>

      {/* Search + Chips + Sort */}
      <View style={styles.controls}>
        <View style={styles.searchWrap}>
          <Icon name="search" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search name or service"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.rowWrap}>
          <View style={styles.chips}>
            {['All', 'Positive', 'Negative'].map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setChip(c)}
                style={[styles.chip, chip === c && styles.chipActive]}>
                <Text
                  style={[
                    styles.chipText,
                    chip === c && styles.chipTextActive,
                  ]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sortWrap}>
            {['Amount', 'Recent'].map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setSort(s)}
                style={[styles.sortBtn, sort === s && styles.sortBtnActive]}>
                <Text
                  style={[
                    styles.sortText,
                    sort === s && styles.sortTextActive,
                  ]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </>
  );

  /* -------- Empty -------- */
  const Empty = (
    <View style={styles.empty}>
      <Icon name="account-balance-wallet" size={42} color="#94a3b8" />
      <Text style={styles.emptyTitle}>
        {loading ? 'Loading…' : 'No results'}
      </Text>
      <Text style={styles.emptyText}>
        {loading
          ? 'Fetching latest balances.'
          : 'Try changing filters or pull to refresh.'}
      </Text>
    </View>
  );

  /* -------- Row -------- */
  const Row = ({item, index}) => {
    const animStyle = useRowAnim(index);
    const bal = toNum(item?.balance_amount);
    const positive = bal > 0;

    return (
      <Animated.View style={[styles.card, animStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.push('WorkerPendingBalance', {serviceData: item})
          }
          style={styles.cardInner}
          accessibilityRole="button"
          accessibilityLabel={`${item?.name ?? 'Worker'} pending balance`}>
          <Image
            source={{uri: item?.profile || 'https://i.pravatar.cc/100?img=15'}}
            style={styles.avatar}
          />
          <View style={{flex: 1}}>
            <Text style={styles.name} numberOfLines={1}>
              {item?.name || '—'}
            </Text>
            <Text style={styles.subtle} numberOfLines={1}>
              {item?.service || '—'}
            </Text>
            <Text style={styles.tinyMuted}>{fmtDate(item?.created_at)}</Text>
          </View>

          <View style={{alignItems: 'flex-end'}}>
            <Text
              style={[
                styles.amount,
                {color: positive ? '#111827' : '#ef4444'},
              ]}>
              {INR(Math.abs(bal))}
            </Text>
            <View
              style={[
                styles.pillRight,
                {backgroundColor: positive ? '#fde68a' : '#fee2e2'},
              ]}>
              <Text
                style={[
                  styles.pillRightText,
                  {color: positive ? '#92400e' : '#991b1b'},
                ]}>
                {positive ? 'Owes Us' : 'We Owe'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filtered}
        renderItem={({item, index}) => <Row item={item} index={index} />}
        keyExtractor={(item, idx) =>
          item?.worker_id?.toString?.() ??
          item?.id?.toString?.() ??
          `row_${idx}`
        }
        contentContainerStyle={{paddingBottom: 24, paddingTop: 8}}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={Empty}
        ItemSeparatorComponent={() => <View style={{height: 8}} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={10}
        windowSize={10}
        removeClippedSubviews
      />

      {/* Floating Send Reminders for current filter */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => sendNotifications(filtered)}
        activeOpacity={0.9}>
        <Icon name="send" size={22} color="#fff" />
        <Text style={styles.fabText}>Remind {filtered.length}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

/* ------------- Styles ------------- */
const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F6F7FB'},

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
    marginBottom: 8,
  },
  headerTitle: {fontSize: 18, fontWeight: '900', color: '#0b1220'},

  tiles: {flexDirection: 'row', gap: 10, paddingHorizontal: 16},
  tile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f1f4',
  },
  tileLabel: {fontSize: 12, color: '#6b7280'},
  tileValue: {fontSize: 16, fontWeight: '900', color: '#0b1220', marginTop: 4},
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {fontSize: 10, fontWeight: '900'},

  controls: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6},
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eef0f3',
  },
  searchInput: {flex: 1, color: '#111827', padding: 0, margin: 0},

  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  chips: {flexDirection: 'row', gap: 8},
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#eceff3',
  },
  chipActive: {backgroundColor: '#111827', borderColor: '#111827'},
  chipText: {fontSize: 12, color: '#111827', fontWeight: '800'},
  chipTextActive: {color: '#fff'},

  sortWrap: {flexDirection: 'row', gap: 8},
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eceff3',
  },
  sortBtnActive: {backgroundColor: '#111827', borderColor: '#111827'},
  sortText: {fontSize: 12, color: '#111827', fontWeight: '800'},
  sortTextActive: {color: '#fff'},

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  cardInner: {flexDirection: 'row', alignItems: 'center', padding: 14},

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  name: {fontSize: 15, fontWeight: '900', color: '#111827'},
  subtle: {fontSize: 12, color: '#6b7280', marginTop: 2},
  tinyMuted: {fontSize: 11, color: '#9ca3af', marginTop: 2},

  amount: {fontSize: 15, fontWeight: '900'},
  pillRight: {
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  pillRightText: {fontSize: 11, fontWeight: '800'},

  empty: {alignItems: 'center', paddingVertical: 40},
  emptyTitle: {fontSize: 16, fontWeight: '900', color: '#111827', marginTop: 8},
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },

  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ff4500',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  fabText: {color: '#fff', fontWeight: '900', fontSize: 12},
});

export default PendingBalanceWorkers;
