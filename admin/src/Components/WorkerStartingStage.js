// WorkerStartingStagePro.jsx
import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------- utils ---------- */
const fmtDate = d => {
  const dt = new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusMeta = (title, issues) => {
  const hasIssues = issues && Object.keys(issues).length > 0;
  if (hasIssues) {
    return {
      icon: 'error-outline',
      tone: '#f59e0b',
      text: 'Issues Found',
      chipBg: '#FEF3C7',
      chipFg: '#92400E',
    };
  }
  switch (title) {
    case 'Mobile Number Verified':
      return {
        icon: 'phone-iphone',
        tone: '#10b981',
        text: 'Verified',
        chipBg: '#DCFCE7',
        chipFg: '#166534',
      };
    case 'Details Verified':
      return {
        icon: 'account-box',
        tone: '#10b981',
        text: 'Verified',
        chipBg: '#DCFCE7',
        chipFg: '#166534',
      };
    case 'Profile and Proof Verified':
      return {
        icon: 'assignment',
        tone: '#10b981',
        text: 'Verified',
        chipBg: '#DCFCE7',
        chipFg: '#166534',
      };
    case 'Bank Account Verified':
      return {
        icon: 'account-balance',
        tone: '#10b981',
        text: 'Verified',
        chipBg: '#DCFCE7',
        chipFg: '#166534',
      };
    default:
      return {
        icon: 'help-outline',
        tone: '#6b7280',
        text: 'Unknown',
        chipBg: '#E5E7EB',
        chipFg: '#374151',
      };
  }
};

/* ---------- tiny UI ---------- */
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

const CardRow = ({item, onPress}) => {
  const meta = getStatusMeta(item.title, item.issues);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.card}>
      <View
        style={[
          styles.iconWrap,
          {backgroundColor: meta.tone + '20', borderColor: meta.tone + '40'},
        ]}>
        <MaterialIcons name={meta.icon} size={22} color={meta.tone} />
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title || '—'}
        </Text>
        <Text style={styles.itemSub} numberOfLines={1}>
          {item.number ? `+91 ${item.number}` : '—'}
        </Text>
        <Text style={styles.itemMeta}>Created: {fmtDate(item.date)}</Text>
      </View>
      <View style={[styles.statusPill, {backgroundColor: meta.chipBg}]}>
        <Text style={[styles.statusPillText, {color: meta.chipFg}]}>
          {meta.text}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/* ---------- screen ---------- */
export default function WorkerStartingStagePro() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [selected, setSelected] = useState([]); // filter chips

  const filterOptions = useMemo(
    () => [
      'Mobile Number Verified',
      'Details Verified',
      'Profile and Proof Verified',
      'Bank Account Verified',
      'Issues',
    ],
    [],
  );

  useEffect(() => {
    const fetchPendingItems = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          'https://backend.clicksolver.com/api/workers/pending/notStarted',
        );
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        const mapped = data.map(w => ({
          title: w.verification_status,
          date: w.created_at,
          issues: w.issues || {},
          workerId: w.worker_id,
          number: w.phone_number,
        }));
        setStatuses(mapped);
      } catch (e) {
        console.log('fetch error', e?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingItems();
  }, []);

  // header anim
  const headAnim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headAnim, {
      toValue: 1,
      duration: 450,
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
          outputRange: [12, 0],
        }),
      },
    ],
  };

  // filter logic (includes "Issues" pseudo-filter)
  const filtered = useMemo(() => {
    if (selected.length === 0) return statuses;
    return statuses.filter(s => {
      const inStatus = selected.includes(s.title);
      const issueChip =
        selected.includes('Issues') &&
        s.issues &&
        Object.keys(s.issues).length > 0;
      return inStatus || issueChip;
    });
  }, [selected, statuses]);

  const toggleChip = label => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(prev =>
      prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label],
    );
  };

  const renderItem = ({item}) => (
    <CardRow
      item={item}
      onPress={() =>
        navigation.push('IndividualWorkerPending', {workerId: item.workerId})
      }
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View style={[styles.header, headStyle]}>
        <Text style={styles.headerTitle}>Starting Stage</Text>
        <Text style={styles.headerSub}>
          Verify & resolve issues for new workers
        </Text>
      </Animated.View>

      {/* Filters */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={x => x}
          contentContainerStyle={{paddingHorizontal: 12}}
          ItemSeparatorComponent={() => <View style={{width: 8}} />}
          showsHorizontalScrollIndicator={false}
          renderItem={({item}) => (
            <Chip
              label={item}
              active={selected.includes(item)}
              onPress={() => toggleChip(item)}
            />
          )}
        />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#FF5722" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it, idx) => String(it.workerId || idx)}
          renderItem={renderItem}
          contentContainerStyle={{padding: 16, paddingBottom: 24}}
          ItemSeparatorComponent={() => <View style={{height: 10}} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialIcons name="inbox" size={28} color="#9ca3af" />
              <Text style={styles.emptyText}>
                No pending items match your filter.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F6F7FB'},

  header: {
    backgroundColor: '#111827',
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {color: '#fff', fontSize: 18, fontWeight: '900'},
  headerSub: {color: '#cbd5e1', fontSize: 12, marginTop: 4},

  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eceff3',
    backgroundColor: '#fff',
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EDEEF3',
  },
  chipActive: {backgroundColor: '#111827'},
  chipText: {fontSize: 12, fontWeight: '800', color: '#111827'},
  chipTextActive: {color: '#fff'},

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eceff3',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  itemTitle: {fontSize: 14, fontWeight: '900', color: '#0b1220'},
  itemSub: {fontSize: 12, color: '#6b7280', marginTop: 2},
  itemMeta: {fontSize: 11, color: '#9ca3af', marginTop: 2},

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 10,
  },
  statusPillText: {fontSize: 11, fontWeight: '900'},

  emptyWrap: {alignItems: 'center', marginTop: 30, gap: 6},
  emptyText: {fontSize: 12, color: '#9ca3af'},
});
