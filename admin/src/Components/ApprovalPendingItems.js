// ApprovalPendingItems.jsx
import axios from 'axios';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  RefreshControl,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

/* ---------- UI bits ---------- */
const STAGES = [
  'Mobile Number Verified',
  'Details Verified',
  'Profile and Proof Verified',
  'Bank Account Verified',
];

const ProgressBar = ({value = 0, tint = '#16a34a'}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const v = Math.max(0, Math.min(1, value));
  useEffect(() => {
    Animated.timing(anim, {
      toValue: v,
      duration: 600,
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

const Chip = ({label, active, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.chip, active && styles.chipActive]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* ---------- Helpers ---------- */
const formatDate = created_at =>
  new Date(created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const firstIssueLine = issues => {
  if (!issues || typeof issues !== 'object') return null;
  const vals = Object.values(issues);
  if (!vals.length) return null;
  // Value can be string OR object like {id, category, description}
  const v = vals[0];
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object')
    return v.description || v.message || v.title || 'Issue detected';
  return null;
};

const colorForStage = idx =>
  [
    '#3b82f6', // mobile
    '#f59e0b', // details
    '#a855f7', // proof
    '#16a34a', // bank
  ][idx] || '#16a34a';

/* ---------- Screen ---------- */
export default function ApprovalPendingItems() {
  const navigation = useNavigation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All'); // All | With Issues | No Issues

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        'https://backend.clicksolver.com/api/workers/pending/verification',
      );
      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      const mapped = data.map(w => {
        const stageTitle = w.verification_status;
        const stageIdx = Math.max(0, STAGES.indexOf(stageTitle));
        return {
          workerId: w.worker_id,
          name: w?.name || 'Worker',
          stageTitle,
          stageIdx,
          date: formatDate(w.created_at),
          issues: w.issues || {},
          progress: (stageIdx + 1) / STAGES.length,
        };
      });
      setRows(mapped);
    } catch (e) {
      console.log('fetch error', e?.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPending();
    setRefreshing(false);
  }, []);

  const summary = useMemo(
    () => ({
      total: rows.length,
      issues: rows.filter(r => Object.keys(r.issues || {}).length > 0).length,
      clean: rows.filter(r => Object.keys(r.issues || {}).length === 0).length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    if (filter === 'All') return rows;
    if (filter === 'With Issues')
      return rows.filter(r => Object.keys(r.issues || {}).length > 0);
    return rows.filter(r => Object.keys(r.issues || {}).length === 0);
  }, [rows, filter]);

  const Header = (
    <>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <MaterialIcons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signup Progress</Text>
        <TouchableOpacity onPress={fetchPending}>
          <MaterialIcons name="refresh" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.sumItem}>
          <Text style={styles.sumNum}>{summary.total}</Text>
          <Text style={styles.sumLabel}>Total</Text>
        </View>
        <View style={styles.sumItem}>
          <Text style={styles.sumNum}>{summary.clean}</Text>
          <Text style={styles.sumLabel}>No Issues</Text>
        </View>
        <View style={styles.sumItem}>
          <Text style={styles.sumNum}>{summary.issues}</Text>
          <Text style={styles.sumLabel}>With Issues</Text>
        </View>
      </View>

      {/* Chips */}
      <View style={styles.chipsRow}>
        {['All', 'With Issues', 'No Issues'].map(c => (
          <Chip
            key={c}
            label={c}
            active={filter === c}
            onPress={() => setFilter(c)}
          />
        ))}
      </View>
    </>
  );

  const Empty = (
    <View style={styles.empty}>
      <MaterialIcons name="fact-check" size={42} color="#94a3b8" />
      <Text style={styles.emptyTitle}>
        {loading ? 'Loading…' : 'Nothing here'}
      </Text>
      <Text style={styles.emptyText}>
        {loading
          ? 'Fetching latest pending verifications.'
          : 'Try changing filters or pull to refresh.'}
      </Text>
    </View>
  );

  const renderItem = ({item}) => {
    const hasIssues = Object.keys(item.issues || {}).length > 0;
    const tint = hasIssues ? '#ef4444' : colorForStage(item.stageIdx);
    const issueLine = firstIssueLine(item.issues);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() =>
          navigation.push('IndividualWorkerPending', {workerId: item.workerId})
        }
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.stageTitle}`}>
        {/* Top */}
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.name || 'W').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.subtle}>Updated • {item.date}</Text>
          </View>
          <View style={[styles.badge, {borderColor: tint}]}>
            <Text style={[styles.badgeText, {color: tint}]}>
              {hasIssues ? 'Issues' : 'In Review'}
            </Text>
          </View>
        </View>

        {/* Stage + progress */}
        <Text style={styles.stageLabel} numberOfLines={1}>
          {item.stageTitle}
        </Text>
        <ProgressBar value={item.progress} tint={tint} />

        {/* Dots */}
        <View style={styles.dotsRow}>
          {STAGES.map((s, i) => {
            const done = i < item.stageIdx;
            const active = i === item.stageIdx;
            return (
              <View key={s} style={styles.dotWrap}>
                <View
                  style={[
                    styles.dot,
                    done
                      ? {backgroundColor: tint}
                      : active
                      ? {backgroundColor: tint, opacity: 0.8}
                      : {},
                  ]}
                />
                {i < STAGES.length - 1 && (
                  <View
                    style={[
                      styles.dash,
                      {backgroundColor: i < item.stageIdx ? tint : '#e5e7eb'},
                    ]}
                  />
                )}
                <Text style={styles.dotText} numberOfLines={1}>
                  {s.replace(' Verified', '')}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Issue preview (safe string) */}
        {hasIssues && issueLine && (
          <View style={styles.issueRow}>
            <MaterialIcons name="error-outline" size={16} color="#ef4444" />
            <Text style={styles.issueText} numberOfLines={2}>
              {issueLine}
            </Text>
          </View>
        )}

        {/* CTA */}
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>Review details</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item, idx) =>
          (item.workerId?.toString?.() || 'row') + '_' + idx
        }
        contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 24}}
        ListHeaderComponent={Header}
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
}

/* ---------- Styles ---------- */
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

  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  sumItem: {alignItems: 'center', flex: 1},
  sumNum: {fontSize: 16, fontWeight: '900', color: '#111827'},
  sumLabel: {fontSize: 11, color: '#6b7280', marginTop: 2},

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 8,
  },
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
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  cardTop: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {color: '#fb923c', fontWeight: '900', fontSize: 18},
  name: {fontSize: 15, fontWeight: '900', color: '#111827'},
  subtle: {fontSize: 12, color: '#6b7280'},

  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {fontSize: 11, fontWeight: '800'},

  stageLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },

  barTrack: {
    height: 10,
    backgroundColor: '#EEEFF2',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {height: '100%', borderRadius: 10},

  dotsRow: {flexDirection: 'row', alignItems: 'center', marginTop: 10},
  dotWrap: {flex: 1, alignItems: 'center'},
  dot: {width: 12, height: 12, borderRadius: 6, backgroundColor: '#e5e7eb'},
  dash: {height: 2, flex: 1, marginTop: -6},
  dotText: {fontSize: 10, color: '#6b7280', marginTop: 6, textAlign: 'center'},

  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  issueText: {fontSize: 12, color: '#991b1b', flex: 1},

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  ctaText: {fontWeight: '800', color: '#111827'},

  empty: {alignItems: 'center', paddingVertical: 40},
  emptyTitle: {fontSize: 16, fontWeight: '900', color: '#111827', marginTop: 8},
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
