// PendingCashbackWorkers.jsx
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

/* ---------------- Helpers ---------------- */

const INR = n => {
  // Robust currency format (handles number or string)
  const num = Number(n ?? 0);
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    // Fallback grouping for Android older JSC
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

// Simple “stagger-in” animation per row
const useRowAnim = index => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 420,
      delay: 70 * index,
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

/* ---------------- Screen ---------------- */

const PendingCashbackWorkers = () => {
  const navigation = useNavigation();

  const [rows, setRows] = useState([]); // API list
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState('All'); // All | High ₹ | Recent

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        'https://backend.clicksolver.com/api/workers/pending/cashback',
      );
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
    } catch (e) {
      console.log('cashback fetch error', e?.message);
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

  // Derived: totals & filtered/sorted
  const summary = useMemo(() => {
    const count = rows.length;
    const total = rows.reduce((acc, r) => {
      // Backend sometimes sends fraction? Example code had "* 100".
      // We’ll keep their intended arithmetic but guard for NaN.
      const raw = Number(r?.pending_cashback ?? 0);
      const value = isFinite(raw) ? raw * 100 : 0;
      return acc + value;
    }, 0);
    return {count, total};
  }, [rows]);

  const filtered = useMemo(() => {
    // text search
    const q = query.trim().toLowerCase();
    let arr = rows.filter(r => {
      if (!q) return true;
      const name = String(r?.name ?? '').toLowerCase();
      const service = String(r?.service ?? '').toLowerCase();
      return name.includes(q) || service.includes(q);
    });

    // chips
    if (chip === 'High ₹') {
      arr = arr
        .slice()
        .sort(
          (a, b) =>
            Number(b?.pending_cashback ?? 0) - Number(a?.pending_cashback ?? 0),
        );
    } else if (chip === 'Recent') {
      arr = arr
        .slice()
        .sort((a, b) => new Date(b?.created_at) - new Date(a?.created_at));
    }

    return arr;
  }, [rows, query, chip]);

  /* -------------- Header Components -------------- */

  const ListHeader = (
    <>
      {/* Top bar */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Cashback</Text>
        <TouchableOpacity onPress={fetchData}>
          <Icon name="refresh" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.sumItem}>
          <Text style={styles.sumNum}>{summary.count}</Text>
          <Text style={styles.sumLabel}>Workers</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.sumItem}>
          <Text style={styles.sumNum}>{INR(summary.total)}</Text>
          <Text style={styles.sumLabel}>Total Pending</Text>
        </View>
      </View>

      {/* Search + Chips */}
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

        <View style={styles.chips}>
          {['All', 'High ₹', 'Recent'].map(c => (
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
      </View>
    </>
  );

  const Empty = (
    <View style={styles.empty}>
      <Icon name="account-balance-wallet" size={40} color="#94a3b8" />
      <Text style={styles.emptyTitle}>
        {loading ? 'Loading…' : 'No pending cashback'}
      </Text>
      <Text style={styles.emptyText}>
        {loading
          ? 'Fetching latest workers.'
          : 'Try changing filters or pull to refresh.'}
      </Text>
    </View>
  );

  /* -------------- Row -------------- */

  const Row = ({item, index}) => {
    const animStyle = useRowAnim(index);
    const amount = Number(item?.pending_cashback ?? 0) * 100;
    const safeAmount = isFinite(amount) ? amount : 0;

    return (
      <Animated.View style={[styles.card, animStyle]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            navigation.push('WorkerPendingCashback', {
              worker_id: item?.worker_id,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`${item?.name ?? 'Worker'} cashback details`}
          style={styles.rowInner}>
          <Image
            source={{uri: item?.profile || 'https://i.pravatar.cc/100?img=13'}}
            style={styles.profile}
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
          <View style={styles.amountWrap}>
            <Text style={styles.amount}>{INR(safeAmount)}</Text>
            <View style={styles.pillRight}>
              <Text style={styles.pillRightText}>Pending</Text>
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
          item?.worker_id?.toString?.() ?? `row_${idx}`
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
    </SafeAreaView>
  );
};

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F6F7FB'},

  headerContainer: {
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
  headerTitle: {fontSize: 18, fontWeight: '900', color: '#111827'},

  summary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  sumItem: {flex: 1, alignItems: 'center'},
  sumNum: {fontSize: 16, fontWeight: '900', color: '#111827'},
  sumLabel: {fontSize: 12, color: '#6b7280', marginTop: 2},
  divider: {width: 1, backgroundColor: '#eef0f3', marginVertical: 4},

  controls: {paddingHorizontal: 16, marginBottom: 10},
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
  chips: {flexDirection: 'row', gap: 8, marginTop: 10},
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  chipActive: {backgroundColor: '#111827'},
  chipText: {fontSize: 12, color: '#111827', fontWeight: '700'},
  chipTextActive: {color: '#fff'},

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
  rowInner: {flexDirection: 'row', alignItems: 'center', padding: 14},
  profile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },

  name: {fontSize: 15, fontWeight: '900', color: '#111827'},
  subtle: {fontSize: 12, color: '#6b7280', marginTop: 2},
  tinyMuted: {fontSize: 11, color: '#9ca3af', marginTop: 2},

  amountWrap: {alignItems: 'flex-end', marginLeft: 10},
  amount: {fontSize: 15, fontWeight: '900', color: '#111827'},
  pillRight: {
    marginTop: 6,
    backgroundColor: '#fde68a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  pillRightText: {fontSize: 11, fontWeight: '800', color: '#92400e'},

  empty: {alignItems: 'center', paddingVertical: 40},
  emptyTitle: {fontSize: 16, fontWeight: '900', color: '#111827', marginTop: 8},
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default PendingCashbackWorkers;
