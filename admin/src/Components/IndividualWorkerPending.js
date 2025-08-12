// IndividualWorkerPending.jsx
import axios from 'axios';
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import SwipeButton from 'rn-swipe-button';
import {Dropdown} from 'react-native-element-dropdown';
import {RadioButton, Checkbox} from 'react-native-paper';
import {useRoute, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ----------------- Helpers & tiny UI bits ----------------- */

const STAGES = [
  'Mobile Number Verified',
  'Details Verified',
  'Profile and Proof Verified',
  'Bank Account Verified',
];

const fmtDate = d =>
  d
    ? new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const subLabel = it => {
  if (typeof it === 'string') return it;
  if (it && typeof it === 'object')
    return it.name || it.title || it.label || String(it.id ?? '');
  return '-';
};

// mount animation hook
const useMountAnim = (delay = 0, dy = 12) => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [a, delay]);
  return {
    opacity: a,
    transform: [
      {translateY: a.interpolate({inputRange: [0, 1], outputRange: [dy, 0]})},
    ],
  };
};

// Animated 0..1 bar
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

const StepDot = ({done, active, tint}) => (
  <View
    style={[
      styles.dot,
      done
        ? {backgroundColor: tint}
        : active
        ? {backgroundColor: tint, opacity: 0.85}
        : {},
    ]}>
    {done ? (
      <MaterialCommunityIcons name="check" size={10} color="#fff" />
    ) : null}
  </View>
);

/* ----------------- Screen ----------------- */

export default function IndividualWorkerPending() {
  const navigation = useNavigation();
  const {workerId} = useRoute().params;

  const [titleColor, setTitleColor] = useState('#FFFFFF');
  const [swiped, setSwiped] = useState(false);

  const [details, setDetails] = useState(null);
  const [personalDetails, setPersonalDetails] = useState(null);
  const [address, setAddress] = useState({});
  const [profile, setProfile] = useState('');

  const [isEditVisible, setEditVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // collapsibles
  const [openPersonal, setOpenPersonal] = useState(true);
  const [openAddress, setOpenAddress] = useState(true);
  const [openSkills, setOpenSkills] = useState(true);
  const [openIssues, setOpenIssues] = useState(true);

  // Issues composer
  const [issues, setIssues] = useState([]); // [{id, category, description, status}]
  const [currentIssueCategory, setCurrentIssueCategory] = useState(null);
  const [currentIssueDescription, setCurrentIssueDescription] = useState('');

  const pendingIssues = issues.filter(i => i.status === 'pending');
  const changedIssues = issues.filter(i => i.status !== 'pending');

  const fetchWorker = useCallback(async () => {
    try {
      const res = await axios.post(
        'https://backend.clicksolver.com/api/individual/worker/pending/verification',
        {workerId},
      );
      const arr = res?.data?.data || [];
      if (arr.length) {
        const w = arr[0];
        setDetails(w);
        setPersonalDetails(w.personaldetails || {});
        setAddress(w.address || {});
        setProfile(w.profile || '');
        setIssues(Array.isArray(w.issues) ? w.issues : []);
      }
    } catch (e) {
      console.log('fetch error', e?.message);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  const currentStageIndex = useMemo(
    () =>
      Math.max(0, STAGES.indexOf(details?.verification_status || STAGES[0])),
    [details?.verification_status],
  );

  const progress = useMemo(
    () => (currentStageIndex + 1) / STAGES.length,
    [currentStageIndex],
  );

  const tintByStage = idx =>
    [
      '#3b82f6', // mobile
      '#f59e0b', // details
      '#a855f7', // proof
      '#16a34a', // bank
    ][idx] || '#7B6CFF';
  const tint = tintByStage(currentStageIndex);

  // pulse for badge
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1.06,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [details?.verification_status]);

  const handleEditPress = () => {
    setEditVisible(v => !v);
    setSelectedStatus('');
  };

  const applyStatusChange = async newStatus => {
    try {
      await axios.post(
        'https://backend.clicksolver.com/api/aprove/tracking/update/status',
        {workerId, newStatus},
      );
      setDetails(d => ({...(d || {}), verification_status: newStatus}));
      setSelectedStatus('');
      setEditVisible(false);
    } catch (e) {
      console.log('status update error', e?.message);
      Alert.alert('Update failed', 'Please try again.');
    }
  };

  const handleStatusChange = status => {
    setSelectedStatus(status);
    Alert.alert('Confirm change', `Change status to "${status}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Yes', onPress: () => applyStatusChange(status)},
    ]);
  };

  const addIssue = () => {
    if (!currentIssueCategory || !currentIssueDescription.trim()) {
      Alert.alert(
        'Validation',
        'Please select a category and describe the issue.',
      );
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newIssue = {
      id: Date.now(),
      category: currentIssueCategory,
      description: currentIssueDescription.trim(),
      status: 'pending',
    };
    setIssues(prev => [newIssue, ...prev]);
    setCurrentIssueCategory(null);
    setCurrentIssueDescription('');
  };

  const removeIssue = id => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIssues(prev => prev.filter(i => i.id !== id));
  };

  const submitAllIssues = async () => {
    try {
      await axios.post(
        'https://backend.clicksolver.com/api/update/worker/issues',
        {workerId, issues},
      );
      Alert.alert('Saved', 'Issues submitted successfully.');
    } catch (e) {
      console.log('issues submit error', e?.message);
      Alert.alert('Failed', 'Could not submit issues. Try again.');
    }
  };

  const approveWorker = async () => {
    try {
      const res = await axios.post(
        'https://backend.clicksolver.com/api/worker/approved',
        {workerId},
      );
      if (res.status === 200)
        Alert.alert('Approved', 'Worker has been approved.');
    } catch (e) {
      console.log('approve error', e?.message);
      Alert.alert('Failed', 'Approval failed. Try again.');
    }
  };

  const ThumbIcon = useCallback(
    () => (
      <View style={styles.thumbContainer}>
        {swiped ? (
          <Entypo name="check" size={20} color="#ff4500" />
        ) : (
          <FontAwesome6 name="arrow-right-long" size={15} color="#ff4500" />
        )}
      </View>
    ),
    [swiped],
  );

  // Anim styles
  const s1 = useMountAnim(0);
  const s2 = useMountAnim(80);
  const s3 = useMountAnim(140);
  const s4 = useMountAnim(200);
  const s5 = useMountAnim(260);

  if (!details || !personalDetails) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={styles.subtle}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View style={[styles.header, s1]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={18} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Approval</Text>
        <TouchableOpacity onPress={handleEditPress}>
          <Text
            style={[
              styles.link,
              {color: isEditVisible ? '#ef4444' : '#7B6CFF'},
            ]}>
            {isEditVisible ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={{paddingBottom: 100}}>
        {/* Profile */}
        <Animated.View style={[styles.card, s2]}>
          <View style={styles.row}>
            <View style={[styles.avatar, {borderColor: tint}]}>
              {profile ? (
                <Image source={{uri: profile}} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>
                  {(details?.name || 'W').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{details?.name || '—'}</Text>
              <Text style={styles.subtle}>{details?.phone_number || '—'}</Text>
              <Text style={styles.muted}>
                Service • {details?.service || '—'}
              </Text>
            </View>
            <Animated.View style={{transform: [{scale: pulse}]}}>
              <View style={[styles.badge, {borderColor: tint}]}>
                <Text style={[styles.badgeText, {color: tint}]}>
                  {details?.verification_status || '—'}
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Status / Progress */}
        <Animated.View style={[styles.card, s3]}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Signup Progress</Text>
            <Text style={styles.smallMuted}>
              Updated • {fmtDate(details?.updated_at)}
            </Text>
          </View>

          <ProgressBar value={progress} tint={tint} />
          <Text style={styles.progressCaption}>
            Step {currentStageIndex + 1} of {STAGES.length}
          </Text>

          <View style={styles.dotsRow}>
            {STAGES.map((s, i) => {
              const done = i < currentStageIndex;
              const active = i === currentStageIndex;
              return (
                <React.Fragment key={s}>
                  <View style={styles.dotWrap}>
                    <StepDot done={done} active={active} tint={tint} />
                    <Text style={styles.dotText} numberOfLines={1}>
                      {s.replace(' Verified', '')}
                    </Text>
                  </View>
                  {i < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.dash,
                        {
                          backgroundColor:
                            i < currentStageIndex ? tint : '#e5e7eb',
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {isEditVisible && (
            <View style={styles.editRow}>
              {STAGES.map(s => {
                const isFuture = STAGES.indexOf(s) > currentStageIndex;
                return (
                  <View key={s} style={styles.radioWrap}>
                    <RadioButton
                      value={s}
                      status={selectedStatus === s ? 'checked' : 'unchecked'}
                      onPress={() => isFuture && handleStatusChange(s)}
                      disabled={!isFuture}
                      color={tint}
                    />
                    <Text style={[styles.small, !isFuture && {opacity: 0.4}]}>
                      {s}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Personal */}
        <Animated.View style={[styles.card, s4]}>
          <SectionHeader
            title="Personal"
            open={openPersonal}
            onToggle={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setOpenPersonal(o => !o);
            }}
          />
          {openPersonal && (
            <View>
              <RowKV k="First name" v={personalDetails?.firstName} />
              <RowKV k="Last name" v={personalDetails?.lastName} />
              <RowKV k="Gender" v={personalDetails?.gender} />
              <RowKV k="Experience" v={personalDetails?.workExperience} />
              <RowKV k="DOB / Age" v={personalDetails?.dob} />
              <RowKV k="Education" v={personalDetails?.education} />
            </View>
          )}
        </Animated.View>

        {/* Address */}
        <Animated.View style={[styles.card, s4]}>
          <SectionHeader
            title="Address"
            open={openAddress}
            onToggle={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setOpenAddress(o => !o);
            }}
          />
          {openAddress && (
            <Text style={styles.addrLine}>
              {[
                address?.doorNo,
                address?.landmark,
                address?.city,
                address?.district,
                address?.state,
                address?.pincode,
              ]
                .filter(Boolean)
                .join(', ') || '—'}
            </Text>
          )}
        </Animated.View>

        {/* Skills */}
        <Animated.View style={[styles.card, s5]}>
          <SectionHeader
            title="Skills"
            open={openSkills}
            onToggle={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setOpenSkills(o => !o);
            }}
          />
          {openSkills && (
            <>
              <View style={styles.pillRow}>
                <View style={[styles.pill, {borderColor: '#e5e7eb'}]}>
                  <Text style={styles.pillText}>{details?.service || '—'}</Text>
                </View>
              </View>
              {!!details?.subservices?.length && (
                <View style={styles.grid}>
                  {details.subservices.map((it, idx) => (
                    <View
                      key={(it?.id ?? idx) + '_sub'}
                      style={styles.checkRow}>
                      <Checkbox status="checked" color={tint} />
                      <Text style={styles.small}>{subLabel(it)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </Animated.View>

        {/* Proof */}
        {!!details?.proof && (
          <Animated.View style={[styles.card, s5]}>
            <Text style={styles.cardTitle}>Proof</Text>
            <Image source={{uri: details.proof}} style={styles.proofImg} />
          </Animated.View>
        )}

        {/* Issues */}
        <Animated.View style={[styles.card, s5]}>
          <SectionHeader
            title="Issues"
            open={openIssues}
            onToggle={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setOpenIssues(o => !o);
            }}
          />
          {openIssues && (
            <>
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                data={STAGES.map(s => ({label: s, value: s}))}
                labelField="label"
                valueField="value"
                placeholder="Select issue category"
                placeholderStyle={{color: '#9ca3af'}}
                selectedTextStyle={{color: '#111827'}}
                value={currentIssueCategory}
                onChange={it => setCurrentIssueCategory(it.value)}
                renderRightIcon={() => (
                  <MaterialIcons name="expand-more" size={18} color="#9ca3af" />
                )}
              />

              <TextInput
                style={styles.textArea}
                value={currentIssueDescription}
                onChangeText={setCurrentIssueDescription}
                multiline
                numberOfLines={4}
                placeholder="Describe the issue…"
                placeholderTextColor="#9ca3af"
              />

              <View style={{alignItems: 'flex-end', marginTop: 8}}>
                <TouchableOpacity
                  style={[styles.btn, {backgroundColor: '#111827'}]}
                  onPress={addIssue}>
                  <Text style={styles.btnText}>Add Issue</Text>
                </TouchableOpacity>
              </View>

              {!!pendingIssues.length && (
                <View style={{marginTop: 12}}>
                  <Text style={styles.sectionHint}>Pending</Text>
                  {pendingIssues.map(i => (
                    <View key={i.id} style={styles.issueRow}>
                      <MaterialIcons
                        name="error-outline"
                        size={16}
                        color="#ef4444"
                      />
                      <View style={{flex: 1}}>
                        <Text style={styles.issueTitle}>{i.category}</Text>
                        <Text style={styles.issueText} numberOfLines={3}>
                          {i.description}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeIssue(i.id)}>
                        <MaterialIcons
                          name="delete-outline"
                          size={20}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {!!changedIssues.length && (
                <View style={{marginTop: 12}}>
                  <Text style={styles.sectionHint}>Changed</Text>
                  {changedIssues.map(i => (
                    <View
                      key={i.id}
                      style={[styles.issueRow, {backgroundColor: '#f3f4f6'}]}>
                      <MaterialIcons
                        name="task-alt"
                        size={16}
                        color="#16a34a"
                      />
                      <View style={{flex: 1}}>
                        <Text style={styles.issueTitle}>{i.category}</Text>
                        <Text style={styles.issueText} numberOfLines={3}>
                          {i.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={{alignItems: 'center', marginTop: 8}}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      borderWidth: 2,
                      borderColor: '#111827',
                      backgroundColor: '#fff',
                    },
                  ]}
                  onPress={submitAllIssues}>
                  <Text style={[styles.btnText, {color: '#111827'}]}>
                    Submit Issues
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Swipe Approve */}
      <View style={styles.swipeWrap}>
        <SwipeButton
          title="Approve"
          titleStyles={{color: titleColor, fontSize: 16, fontWeight: '800'}}
          railBackgroundColor="#ff4500"
          railBorderColor="#ff4500"
          height={48}
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
                <FontAwesome6
                  name="arrow-right-long"
                  size={16}
                  color="#ff4500"
                />
              )}
            </View>
          )}
          thumbIconBackgroundColor="#fff"
          thumbIconBorderColor="#fff"
          thumbIconWidth={44}
          thumbIconStyles={{height: 36, width: 36, borderRadius: 20}}
          onSwipeStart={() => setTitleColor('#e5e7eb')}
          onSwipeSuccess={() => {
            setTitleColor('#FFFFFF');
            setSwiped(true);
            approveWorker();
          }}
          onSwipeFail={() => setTitleColor('#FFFFFF')}
        />
      </View>
    </SafeAreaView>
  );
}

/* ----------------- Small components ----------------- */
const SectionHeader = ({title, open, onToggle}) => (
  <TouchableOpacity
    onPress={onToggle}
    activeOpacity={0.9}
    style={styles.sectionHead}>
    <Text style={styles.cardTitle}>{title}</Text>
    <MaterialIcons
      name={open ? 'expand-less' : 'expand-more'}
      size={20}
      color="#6b7280"
    />
  </TouchableOpacity>
);

const RowKV = ({k, v}) => (
  <View style={styles.rowBetween}>
    <Text style={styles.itemKey}>{k}</Text>
    <Text style={styles.itemVal}>{v || '—'}</Text>
  </View>
);

/* ----------------- Styles ----------------- */
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
  link: {fontWeight: '900'},

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
  cardTitle: {fontSize: 16, fontWeight: '900', color: '#111827'},

  row: {flexDirection: 'row', alignItems: 'center', gap: 12},
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarImg: {width: 56, height: 56, borderRadius: 12},
  avatarText: {color: '#fb923c', fontWeight: '900', fontSize: 20},

  name: {fontSize: 16, fontWeight: '900', color: '#111827'},
  subtle: {fontSize: 12, color: '#6b7280'},
  small: {fontSize: 12, color: '#111827'},
  smallMuted: {fontSize: 12, color: '#6b7280'},
  muted: {fontSize: 12, color: '#6b7280', marginTop: 2},

  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {fontSize: 11, fontWeight: '900'},

  // progress
  barTrack: {
    height: 10,
    backgroundColor: '#EEEFF2',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: {height: '100%', borderRadius: 10},
  progressCaption: {fontSize: 12, color: '#6b7280', marginTop: 6},

  // dots
  dotsRow: {flexDirection: 'row', alignItems: 'center', marginTop: 10},
  dotWrap: {alignItems: 'center', maxWidth: '25%'},
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dash: {
    height: 2,
    flex: 1,
    marginTop: -10,
    marginHorizontal: 6,
    backgroundColor: '#e5e7eb',
  },
  dotText: {fontSize: 10, color: '#6b7280', marginTop: 6, textAlign: 'center'},

  editRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12},
  radioWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    borderRadius: 999,
  },

  itemKey: {fontSize: 13, color: '#6b7280'},
  itemVal: {fontSize: 13, color: '#111827', fontWeight: '800'},

  addrLine: {color: '#111827', marginTop: 4},

  pillRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  pillText: {fontWeight: '900', color: '#111827', fontSize: 12},

  grid: {marginTop: 8},
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },

  proofImg: {width: 120, height: 180, borderRadius: 10, alignSelf: 'center'},

  // Issues
  dropdown: {
    height: 44,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  dropdownContainer: {backgroundColor: '#fff', borderRadius: 10},
  textArea: {
    height: 120,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    marginTop: 8,
    color: '#111827',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHint: {fontSize: 12, color: '#6b7280', marginBottom: 6},
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  issueTitle: {fontSize: 13, fontWeight: '900', color: '#111827'},
  issueText: {fontSize: 12, color: '#6b7280', marginTop: 2},

  btn: {paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12},
  btnText: {color: '#fff', fontWeight: '900'},

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

  loadingWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
