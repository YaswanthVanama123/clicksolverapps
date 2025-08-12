import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  TextInput,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

/* ---------- Tiny building blocks ---------- */

// Animated bar 0..1
const ProgressBar = ({value = 0, tint = '#22c55e'}) => {
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
    <View style={styles.barTrack} accessible accessibilityLabel="progress">
      <Animated.View style={[styles.barFill, {width, backgroundColor: tint}]} />
    </View>
  );
};

const Chip = ({label, active, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.chip, active && styles.chipActive]}
    accessibilityRole="button"
    accessibilityState={{selected: !!active}}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const SkeletonCard = () => (
  <View style={styles.skelCard}>
    <View style={styles.skelIcon} />
    <View style={{flex: 1}}>
      <View style={styles.skelLineLg} />
      <View style={styles.skelBar} />
      <View style={styles.skelLineSm} />
    </View>
  </View>
);

/* ---------- Main Screen ---------- */

const FILTERS = ['All', 'Collected Item', 'Work started', 'Work Completed'];

export default function AdministratorAllTrackings() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const navigation = useNavigation();

  const formatDate = created_at =>
    new Date(created_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const mapStatus = status => {
    switch (status) {
      case 'Work Completed':
        return {
          pct: 1,
          color: '#22c55e',
          icon: 'check-circle',
          tag: 'Done',
          sub: 'Completed successfully',
        };
      case 'Work started':
        return {
          pct: 0.66,
          color: '#f59e0b',
          icon: 'hammer',
          tag: 'Ongoing',
          sub: 'Work in progress',
        };
      case 'Collected Item':
        return {
          pct: 0.33,
          color: '#3b82f6',
          icon: 'truck',
          tag: 'Pickup',
          sub: 'Item collected',
        };
      default:
        return {
          pct: 0.15,
          color: '#94a3b8',
          icon: 'progress-clock',
          tag: 'Pending',
          sub: 'Awaiting update',
        };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const {data} = await axios.get(
        'https://backend.clicksolver.com/api/all/tracking/services',
      );
      setRaw(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('fetch error', e?.message);
      setRaw([]);
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

  // derived list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return raw.filter(item => {
      const statusOk =
        activeFilter === 'All' ? true : item.service_status === activeFilter;
      const qOk = !q
        ? true
        : `${item.service_status} ${formatDate(item.created_at)}`
            .toLowerCase()
            .includes(q);
      return statusOk && qOk;
    });
  }, [raw, activeFilter, query]);

  // header summary counts
  const counts = useMemo(
    () => ({
      all: raw.length,
      collected: raw.filter(x => x.service_status === 'Collected Item').length,
      started: raw.filter(x => x.service_status === 'Work started').length,
      done: raw.filter(x => x.service_status === 'Work Completed').length,
    }),
    [raw],
  );

  const renderItem = useCallback(
    ({item}) => {
      const meta = mapStatus(item.service_status);
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() =>
            navigation.push('ServiceTrackingItem', {
              tracking_id: item.tracking_id,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`${item.service_status}, ${formatDate(
            item.created_at,
          )}`}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={meta.icon}
              size={22}
              color="#ff4500"
            />
          </View>
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.service_status}
              </Text>
              <Text
                style={[
                  styles.badge,
                  {color: meta.color, borderColor: meta.color},
                ]}>
                {meta.tag}
              </Text>
            </View>
            <ProgressBar value={meta.pct} tint={meta.color} />
            <Text style={styles.subtitle} numberOfLines={1}>
              {meta.sub} • {formatDate(item.created_at)}
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color="#c1c1c1" />
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="arrow-back" size={22} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Tracking</Text>
        <View style={{width: 22}} />
      </View>

      {/* Sticky summary + chips */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{counts.all}</Text>
            <Text style={styles.sumLabel}>Total</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{counts.collected}</Text>
            <Text style={styles.sumLabel}>Collected</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{counts.started}</Text>
            <Text style={styles.sumLabel}>Started</Text>
          </View>
          <View style={styles.sumItem}>
            <Text style={styles.sumNum}>{counts.done}</Text>
            <Text style={styles.sumLabel}>Done</Text>
          </View>
        </View>
        <View style={styles.chipsRow}>
          {FILTERS.map(f => (
            <Chip
              key={f}
              label={f}
              active={activeFilter === f}
              onPress={() => setActiveFilter(f)}
            />
          ))}
        </View>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color="#6b7280" />
          <TextInput
            placeholder="Search status or date…"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{padding: 16}}>
          {[0, 1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="clipboard-search"
            size={44}
            color="#94a3b8"
          />
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptyText}>
            Try adjusting filters or clearing the search.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item, idx) =>
            (item.tracking_id?.toString?.() || 'row') + '_' + idx
          }
          contentContainerStyle={{
            padding: 16,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          initialNumToRender={10}
          windowSize={10}
          getItemLayout={(_, index) => ({
            length: 86,
            offset: 86 * index,
            index,
          })}
        />
      )}
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
  headerTitle: {fontSize: 18, fontWeight: '800', color: '#212121'},

  summaryCard: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sumItem: {alignItems: 'center', flex: 1},
  sumNum: {fontSize: 16, fontWeight: '900', color: '#212121'},
  sumLabel: {fontSize: 11, color: '#6b7280', marginTop: 2},

  chipsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10},
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  chipActive: {backgroundColor: '#111827'},
  chipText: {fontSize: 12, color: '#111827', fontWeight: '700'},
  chipTextActive: {color: '#fff'},

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  input: {flex: 1, color: '#111827', padding: 0, fontSize: 14},

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 2,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  body: {flex: 1},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    flexShrink: 1,
    paddingRight: 8,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
  },

  barTrack: {
    height: 8,
    backgroundColor: '#EEEFF2',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {height: '100%', borderRadius: 8},
  subtitle: {marginTop: 6, color: '#6b7280', fontSize: 12},

  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  emptyTitle: {fontSize: 16, fontWeight: '900', color: '#111827', marginTop: 8},
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // skeletons
  skelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  skelIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  skelLineLg: {
    height: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginBottom: 8,
    width: '70%',
  },
  skelBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    width: '100%',
  },
  skelLineSm: {
    height: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginTop: 8,
    width: '55%',
  },
});
