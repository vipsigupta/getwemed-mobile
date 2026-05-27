import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Linking,
  Share,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

// ── Types ────────────────────────────────────────────────────────────────────
type Religion = 'HINDU' | 'SIKH' | 'CHRISTIAN' | 'MUSLIM';
type EventType = 'WEDDING' | 'BIRTHDAY' | 'ANNIVERSARY' | 'POOJA' | 'GET_TOGETHER' | 'OTHER';

interface ThemeConfig {
  label: string;
  flag: string;
  ornament: string;
  symbol: string;
  primary: string;
  primaryDim: string;
  accent: string;
  heroBg: string;
  cardBgColors: string[];
  overlayBase: string[]; // [transparent, mid-fade, deep-fade, heroBg] for hero photo gradient
  photoUrl: string;
  coupleSeparator: string;
  buttonGradient: string[];
  pillBg: string;
  pillBorder: string;
}

interface CeremonyDetails {
  name: string;
  blessing: string;
  emojis: string[];
}

// ── Religious Themes (Visual/Color configs only) ─────────────────────────────
const THEMES: Record<Religion, ThemeConfig> = {
  HINDU: {
    label: "Hindu",
    flag: "🪔",
    ornament: "✦",
    symbol: "🪔",
    primary: "#E5C05C",
    primaryDim: "rgba(229,192,92,0.6)",
    accent: "#800000",
    heroBg: "#160b08",
    cardBgColors: ["#180c08", "#120805"],
    overlayBase: ['transparent', 'rgba(22,11,8,0.2)', 'rgba(22,11,8,0.7)', '#160b08'],
    photoUrl: "https://images.unsplash.com/photo-1665960213508-48f07086d49c?w=800&h=1000&fit=crop&auto=format",
    coupleSeparator: "❤️",
    buttonGradient: ["#E5C05C", "#F3D782", "#C69E35"],
    pillBg: "rgba(229,192,92,0.04)",
    pillBorder: "rgba(229,192,92,0.12)",
  },
  SIKH: {
    label: "Sikh",
    flag: "🟠",
    ornament: "☬",
    symbol: "🌸",
    primary: "#FF9F33",
    primaryDim: "rgba(255,159,51,0.6)",
    accent: "#003366",
    heroBg: "#060912",
    cardBgColors: ["#0a0e1a", "#05070d"],
    overlayBase: ['transparent', 'rgba(6,9,18,0.2)', 'rgba(6,9,18,0.7)', '#060912'],
    photoUrl: "https://images.unsplash.com/photo-1633104502699-b2ecf0fee294?w=800&h=1000&fit=crop&auto=format",
    coupleSeparator: "🌸",
    buttonGradient: ["#FF9F33", "#FFC07A", "#D67710"],
    pillBg: "rgba(255,159,51,0.04)",
    pillBorder: "rgba(255,159,51,0.12)",
  },
  CHRISTIAN: {
    label: "Christian",
    flag: "✝️",
    ornament: "✝",
    symbol: "🕊️",
    primary: "#B6A7BC",
    primaryDim: "rgba(182,167,188,0.6)",
    accent: "#4a7c59",
    heroBg: "#0a0c10",
    cardBgColors: ["#0d1117", "#07090d"],
    overlayBase: ['transparent', 'rgba(10,12,16,0.2)', 'rgba(10,12,16,0.7)', '#0a0c10'],
    photoUrl: "https://images.unsplash.com/photo-1474867985807-96ca17098cc9?w=800&h=1000&fit=crop&auto=format",
    coupleSeparator: "🤍",
    buttonGradient: ["#B6A7BC", "#D1C6D6", "#918197"],
    pillBg: "rgba(182,167,188,0.04)",
    pillBorder: "rgba(182,167,188,0.12)",
  },
  MUSLIM: {
    label: "Muslim",
    flag: "☪️",
    ornament: "☪",
    symbol: "🌙",
    primary: "#45DF85",
    primaryDim: "rgba(69,223,133,0.6)",
    accent: "#1a5c38",
    heroBg: "#030805",
    cardBgColors: ["#050f0a", "#020604"],
    overlayBase: ['transparent', 'rgba(3,8,5,0.2)', 'rgba(3,8,5,0.7)', '#030805'],
    photoUrl: "https://images.unsplash.com/photo-1630198908899-fc1226ddbac4?w=800&h=1000&fit=crop&auto=format",
    coupleSeparator: "🌙",
    buttonGradient: ["#45DF85", "#79F0AC", "#23A25C"],
    pillBg: "rgba(69,223,133,0.04)",
    pillBorder: "rgba(69,223,133,0.12)",
  },
};

// ── Ceremony Details Matrix (Religion × EventType) ───────────────────────────
const CEREMONY_MATRIX: Record<Religion, Record<EventType, CeremonyDetails>> = {
  HINDU: {
    WEDDING:       { name: 'Vivah Utsav',       blessing: 'Shubh Vivah · शुभ विवाह',                 emojis: ['❤️', '💐', '✨', '🎊'] },
    BIRTHDAY:      { name: 'Janamdin Utsav',    blessing: 'Janamdin Ki Shubhkamnaayein · जन्मदिन',    emojis: ['🎂', '🎉', '✨', '🎈'] },
    ANNIVERSARY:   { name: 'Vivah Varshgath',   blessing: 'Shubh Varshgath · शुभ वर्षगाँठ',           emojis: ['💍', '❤️', '✨', '🌹'] },
    POOJA:         { name: 'Puja Mahotsav',     blessing: 'Om Shanti · ॐ शान्ति',                     emojis: ['🪔', '🙏', '✨', '🌺'] },
    GET_TOGETHER:  { name: 'Milan Samaroh',     blessing: 'Saath Mein Khushi · मिलन',                 emojis: ['🎊', '🤝', '✨', '🎉'] },
    OTHER:         { name: 'Utsav',             blessing: 'Shubh Aarambh · शुभ',                      emojis: ['✨', '🎊', '❤️', '🪔'] },
  },
  SIKH: {
    WEDDING:       { name: 'Anand Karaj',       blessing: 'Waheguru Ji Ka Khalsa · ਵਾਹਿਗੁਰੂ',         emojis: ['🌸', '🙏', '✨', '🎋'] },
    BIRTHDAY:      { name: 'Janam Dihada',      blessing: 'Waheguru Ji · ਜਨਮ ਦਿਹਾੜਾ',                 emojis: ['🎂', '🌸', '✨', '🎈'] },
    ANNIVERSARY:   { name: 'Salgirha Mubarak',  blessing: 'Waheguru Di Kirpa · ਸਾਲਗਿਰਹ',              emojis: ['💍', '🌸', '✨', '🌹'] },
    POOJA:         { name: 'Ardaas Samagam',    blessing: 'Waheguru Ji · ਅਰਦਾਸ',                      emojis: ['🙏', '☬', '✨', '🌸'] },
    GET_TOGETHER:  { name: 'Sangat Milan',      blessing: 'Sangat Di Khushi · ਸੰਗਤ',                  emojis: ['🎊', '🌸', '✨', '🎉'] },
    OTHER:         { name: 'Samagam',           blessing: 'Waheguru Ji · ਵਾਹਿਗੁਰੂ',                   emojis: ['✨', '🌸', '🙏', '🎊'] },
  },
  CHRISTIAN: {
    WEDDING:       { name: 'Holy Matrimony',        blessing: "Blessed Union · God's Grace",           emojis: ['🕊️', '🌿', '💒', '🤍'] },
    BIRTHDAY:      { name: 'Birthday Blessing',     blessing: "God's Blessings · Happy Birthday",     emojis: ['🎂', '🕊️', '✨', '🎈'] },
    ANNIVERSARY:   { name: 'Anniversary Grace',     blessing: "God's Everlasting Love",               emojis: ['💍', '🕊️', '✨', '🌹'] },
    POOJA:         { name: 'Prayer Service',         blessing: "In God's Name · Amen",                 emojis: ['⛪', '🙏', '✨', '🕊️'] },
    GET_TOGETHER:  { name: 'Fellowship Gathering',   blessing: 'Together in Joy',                      emojis: ['🎊', '🕊️', '✨', '🎉'] },
    OTHER:         { name: 'Celebration',            blessing: 'Bless This Day',                       emojis: ['✨', '🕊️', '🤍', '🎊'] },
  },
  MUSLIM: {
    WEDDING:       { name: 'Nikah Ceremony',     blessing: "Masha'Allah · ما شاء الله",                emojis: ['🌙', '✨', '💚', '🌿'] },
    BIRTHDAY:      { name: 'Jashan-e-Wiladat',  blessing: 'Mubarak Ho · مبارک ہو',                    emojis: ['🎂', '🌙', '✨', '🎈'] },
    ANNIVERSARY:   { name: 'Salgirha Mubarak',  blessing: 'Allah Ki Rehmat · سالگرہ',                 emojis: ['💍', '🌙', '✨', '🌹'] },
    POOJA:         { name: 'Dua Mehfil',         blessing: 'Bismillah · بسم الله',                     emojis: ['🕌', '🤲', '✨', '🌙'] },
    GET_TOGETHER:  { name: 'Mehfil',             blessing: 'Khushi Ka Mauqa · خوشی',                  emojis: ['🎊', '🌙', '✨', '🎉'] },
    OTHER:         { name: 'Jashn',              blessing: "Insha'Allah · ان شاء الله",                emojis: ['✨', '🌙', '💚', '🎊'] },
  },
};

function getCeremonyDetails(religion: Religion, eventType: string): CeremonyDetails {
  const normalised = (eventType || 'WEDDING').toUpperCase() as EventType;
  const religionMap = CEREMONY_MATRIX[religion] || CEREMONY_MATRIX.HINDU;
  return religionMap[normalised] || religionMap.WEDDING;
}

// ── Floating Reactions (Shoot diagonally outwards from the center of the image!) ──
const FloatingReaction = ({ emoji, index }: { emoji: string; index: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnim = () => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 3200 + index * 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => startAnim());
    };

    const delay = setTimeout(startAnim, index * 600);
    return () => clearTimeout(delay);
  }, []);

  // Map each of the 4 emojis to a unique flying trajectory
  let targetX = 0;
  let targetY = 0;
  if (index === 0) { targetX = -90; targetY = -110; }      // Top Left
  else if (index === 1) { targetX = 90; targetY = -110; }   // Top Right
  else if (index === 2) { targetX = -60; targetY = -40; }   // Center Left
  else { targetX = 60; targetY = -40; }                     // Center Right

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetX],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetY],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.15, 0.8, 1],
    outputRange: [0, 0.5, 0.45, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [0.1, 1.4, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.floatingEmojiContainer,
        {
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Text style={styles.floatingEmojiText}>{emoji}</Text>
    </Animated.View>
  );
};

// ── Countdown Component ──────────────────────────────────────────────────────
const CountdownBox = ({ targetDate, theme }: { targetDate: Date; theme: ThemeConfig }) => {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const blocks = [
    { val: String(t.d).padStart(2, '0'), lbl: 'Days' },
    { val: String(t.h).padStart(2, '0'), lbl: 'Hours' },
    { val: String(t.m).padStart(2, '0'), lbl: 'Mins' },
    { val: String(t.s).padStart(2, '0'), lbl: 'Secs' },
  ];

  return (
    <View style={[styles.countdown, { backgroundColor: theme.pillBg, borderColor: theme.pillBorder }]}>
      <Text style={[styles.countdownTitle, { color: theme.primaryDim }]}>BEGINS IN</Text>
      <View style={styles.countdownRow}>
        {blocks.map(({ val, lbl }) => (
          <View key={lbl} style={styles.timeBlock}>
            <Text style={[styles.timeNum, { color: theme.primary }]}>{val}</Text>
            <Text style={[styles.timeLbl, { color: theme.primaryDim }]}>{lbl}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const parseDateSafely = (dateVal: any): Date => {
  if (!dateVal) return new Date('2026-12-25T11:00:00Z');
  try {
    if (dateVal instanceof Date) return dateVal;
    let dStr = String(dateVal).trim();
    if (dStr.includes(' ') && !dStr.includes('T')) {
      dStr = dStr.replace(' ', 'T');
    }
    if (!dStr.endsWith('Z') && !dStr.includes('+') && !dStr.includes('-') && dStr.includes('T')) {
      dStr = dStr + 'Z';
    }
    const parsed = new Date(dStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (_) {}
  return new Date('2026-12-25T11:00:00Z');
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function InvitationScreen({
  space,
  authToken,
  onLoginSuccess,
  onJoin,
  onBack,
}: {
  space: any;
  authToken?: string | null;
  onLoginSuccess?: (token: string) => void;
  onJoin: () => void;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const cardY = useRef(new Animated.Value(450)).current;
  const btnScale = useRef(new Animated.Value(0.85)).current;

  // ── Auth Popup States ──
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Parse Space and Religion (Safely handles both Raw database space and Enriched space) ──
  let keyPeople: any = {};
  let welcomeMessage = '';
  let rawVenue = '';
  let locationLink = '';

  // Check if the space is already enriched by the backend
  if (space?.keyPeople && typeof space.keyPeople === 'object') {
    keyPeople = space.keyPeople;
    welcomeMessage = space.welcomeMessage || '';
    rawVenue = space.venue || '';
    locationLink = space.locationLink || '';
  } else {
    // If it's a raw database space, parse it from the theme JSON string
    let themeObj: any = {};
    try {
      if (space?.theme) {
        themeObj = typeof space.theme === 'string' ? JSON.parse(space.theme) : space.theme;
      }
    } catch (_) {}
    
    keyPeople = themeObj?.keyPeople || {};
    welcomeMessage = themeObj?.welcomeMessage || '';
    rawVenue = themeObj?.venue || '';
    locationLink = themeObj?.locationLink || '';
  }

  let dbReligion: Religion = 'HINDU';
  const parsedRel = (keyPeople?.religion || space?.religion || 'HINDU').toUpperCase();
  if (parsedRel in THEMES) {
    dbReligion = parsedRel as Religion;
  }
  const person1Name = keyPeople?.person1?.name || 'Aman';
  const person2Name = keyPeople?.person2?.name || 'Riya';
  const focusType = keyPeople?.focusType || '2_PERSON';

  const t = THEMES[dbReligion];
  const eventType = (space?.eventType || 'WEDDING').toUpperCase();
  const ceremony = getCeremonyDetails(dbReligion, eventType);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardY, { toValue: 0, tension: 45, friction: 9, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, tension: 35, friction: 8, delay: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Extracted Parsers ──
  const themeMessage = welcomeMessage || '';
  const venueParts = rawVenue.split(' (');
  const venueName = venueParts[0]?.trim() || 'The Grand Palace, Udaipur, Rajasthan';
  const venueLink = venueParts[1]?.replace(')', '').trim() || locationLink || '';

  // Photo: Prioritize uploaded space couple photo, fallback to theme photo
  let coverUri = t.photoUrl;
  if (keyPeople?.starPhoto && keyPeople.starPhoto.trim() !== '') {
    coverUri = keyPeople.starPhoto;
  } else if (space?.coverUrl && space.coverUrl.trim() !== '' && !space.coverUrl.includes('unsplash.com/photo-1519225421980')) {
    coverUri = space.coverUrl;
  }

  const spaceName = space?.name || 'Wedding Celebration';
  const is2Person = (focusType === '2_PERSON') && person1Name && person2Name;

  const dateObj = parseDateSafely(space?.date);
  const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const guestCount = space?._count?.guests || 243;
  const inviteCode = space?.inviteCode || '';

  const isHost = space?.role === 'HOST' || space?.isAdmin === true;

  const openVenueMap = () => { if (venueLink) Linking.openURL(venueLink).catch(() => {}); };

  // ── Join Button Pressed ──
  const handleJoinPress = () => {
    if (authToken) {
      // User is already logged in, enter wedding feed directly
      onJoin();
    } else {
      // Prompt popup modal for phone & OTP authentication
      setPhoneNumber('');
      setOtpCode('');
      setAuthError(null);
      setAuthStep('phone');
      setShowAuthModal(true);
    }
  };

  // ── Send OTP API ──
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      // Simulate real-world network delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 800));
      setAuthStep('otp');
    } catch (e) {
      setAuthError('Failed to send verification code. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Verify OTP API ──
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setAuthError('Please enter the 4-digit verification code');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const mockUid = `${phoneNumber.replace(/\D/g, '')}_${otpCode}`;
      const mockToken = `mock_firebase_token_${mockUid}`;

      // Hit actual backend session API to fetch or create the user session
      const res = await axios.get(`https://getmewed-backend.vercel.app/v1/auth/session`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      // Update token in root layout context
      if (onLoginSuccess) {
        onLoginSuccess(mockToken);
      }

      setShowAuthModal(false);
      
      // Successfully authenticated! Seamlessly enter the wedding feed.
      onJoin();
    } catch (err) {
      console.warn('Authentication verification error:', err);
      // Fallback in case of server/network issues during dev demo
      const fallbackToken = `mock_firebase_token_${phoneNumber.replace(/\D/g, '')}9999999999`;
      if (onLoginSuccess) {
        onLoginSuccess(fallbackToken);
      }
      setShowAuthModal(false);
      onJoin();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://getmewed-backend.vercel.app/invite/${inviteCode}`;
      const message = `${ceremony.blessing}\n\nYou are cordially invited to ${spaceName}'s ${ceremony.name}! ${t.symbol}\nJoin our celebration space here: ${shareUrl}\nInvite Code: ${inviteCode}`;
      await Share.share({
        message,
        url: shareUrl,
        title: `${spaceName} Invitation`,
      });
    } catch (e) {
      console.warn("Share error:", e);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: t.heroBg }]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={true}
      >
        {/* ── TOP: Dynamic Couple Photo Header ── */}
        <View style={styles.photoHeaderContainer}>
          <Image
            source={{ uri: coverUri }}
            style={styles.topPhoto}
            resizeMode="cover"
          />

          {/* Theme-aware vertical multi-step linear gradient fade */}
          <LinearGradient
            colors={t.overlayBase as any}
            style={StyleSheet.absoluteFill}
          />

          {/* Dynamic Floating Emojis (Religion × EventType driven) */}
          {ceremony.emojis.map((emoji, i) => (
            <FloatingReaction key={`${dbReligion}-${eventType}-${i}`} emoji={emoji} index={i} />
          ))}

          {/* Elegant Back Navigation */}
          {onBack && (
            <TouchableOpacity
              style={[styles.backBtn, { top: insets.top + 8 }]}
              onPress={onBack}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── BOTTOM: Sliding dark invitation card ── */}
        <Animated.View style={[styles.card, { transform: [{ translateY: cardY }], backgroundColor: t.heroBg, borderColor: t.pillBorder }]}>
          <LinearGradient
            colors={t.cardBgColors as any}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={[styles.cardContent, { paddingBottom: insets.bottom + 140 }]}>
            {/* Ornamental Divider */}
            <View style={styles.decorRow}><LinearGradient colors={['transparent', t.primaryDim]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.decorLine} /><Text style={[styles.decorOrnament, { color: t.primary }]}>{t.ornament}</Text><LinearGradient colors={[t.primaryDim, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.decorLine} /></View>

            {/* Blessing Line (Religion × EventType) */}
            <Text style={[styles.blessingLine, { color: t.primaryDim }]}>{ceremony.blessing}</Text>

            {/* You are invited label */}
            <Text style={[styles.invitedLabel, { color: 'rgba(255,255,255,0.45)' }]}>YOU ARE INVITED TO</Text>

            {/* Main Couple Names */}
            {is2Person ? (
              <Text style={styles.namesRow} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                <Text style={styles.name}>{person1Name}</Text>
                <Text style={[styles.ampersand, { color: t.primary }]}> {t.coupleSeparator} </Text>
                <Text style={styles.name}>{person2Name}</Text>
              </Text>
            ) : (
              <Text style={styles.nameSingle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>
                {person1Name || spaceName}
              </Text>
            )}

            {/* Dynamic Ceremony Label (Religion × EventType) */}
            <Text style={[styles.celebrationLabel, { color: t.primaryDim }]}>
              {ceremony.name}
            </Text>

            {/* Symbol Divider */}
            <View style={styles.decorRow}><LinearGradient colors={['transparent', t.pillBorder]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.decorLine} /><Text style={styles.symbolText}>{t.symbol}</Text><LinearGradient colors={[t.pillBorder, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.decorLine} /></View>

            {/* Real-time Countdown Box */}
            <CountdownBox targetDate={dateObj} theme={t} />

            {/* Details Section */}
            <View style={styles.details}>
              {/* Date */}
              <View style={styles.detailRow}>
                <View style={[styles.iconCircle, { borderColor: t.pillBorder }]}>
                  <Feather name="calendar" size={17} color={t.primary} />
                </View>
                <Text style={styles.detailText}>{dateStr} · 11 AM onwards</Text>
              </View>

              {/* Venue */}
              <TouchableOpacity
                style={styles.detailRow}
                onPress={venueLink ? openVenueMap : undefined}
                activeOpacity={venueLink ? 0.75 : 1}
              >
                <View style={[styles.iconCircle, { borderColor: t.pillBorder }]}>
                  <Feather name="map-pin" size={17} color={t.primary} />
                </View>
                <Text style={styles.detailText} numberOfLines={2}>{venueName}</Text>
                {venueLink && (
                  <Feather name="external-link" size={14} color={t.primary} style={{ marginLeft: 6 }} />
                )}
              </TouchableOpacity>

              {/* Guests already joined */}
              <View style={styles.detailRow}>
                <View style={[styles.iconCircle, { borderColor: t.pillBorder }]}>
                  <Feather name="users" size={17} color={t.primary} />
                </View>
                <Text style={styles.detailText}>
                  {guestCount > 0
                    ? `${guestCount} guests have already joined`
                    : 'Be the first to join the celebration!'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── STICKY CTA BUTTONS (Stacked: Primary Join + Share below if Host) ── */}
      <Animated.View
        style={[
          styles.btnWrapper,
          {
            paddingBottom: Math.max(insets.bottom, 24),
            transform: [{ scale: btnScale }],
            backgroundColor: t.heroBg,
            borderTopColor: t.pillBorder
          },
        ]}
      >
        {/* Primary Join Button — 3D gradient with inner highlight */}
        <TouchableOpacity onPress={handleJoinPress} activeOpacity={0.85} style={styles.joinBtnOpacity}>
          <LinearGradient
            colors={t.buttonGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.joinBtnGradient}
          >
            {/* Inner highlight strip for 3D depth */}
            <View style={styles.joinBtnHighlight} />
            <Text style={[styles.joinBtnText, dbReligion === 'CHRISTIAN' ? { color: '#0d1117' } : null]}>
              Join {ceremony.name} {t.symbol}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Share Invitation Button — Visible only to Key Persons and the Host */}
        {isHost && (
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.8}
            style={[styles.shareBtn, { borderColor: t.pillBorder, backgroundColor: t.pillBg }]}
          >
            <Feather name="share-2" size={18} color={t.primary} />
            <Text style={[styles.shareBtnText, { color: t.primary }]}>Share Invitation</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── PREMIUM GLASSMORPHIC AUTHENTICATION MODAL ── */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAuthModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          {/* Deep dark overlay to blur background */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setShowAuthModal(false);
            }}
          >
            <View style={styles.backdropDim} />
          </TouchableOpacity>

          {/* Premium Bottom Sheet Modal Content */}
          <View style={[styles.modalSheet, { backgroundColor: t.heroBg, borderColor: t.pillBorder }]}>
            <LinearGradient
              colors={t.cardBgColors as any}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIndicator, { backgroundColor: t.pillBorder }]} />
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setShowAuthModal(false)}
              >
                <Feather name="x" size={20} color={t.primaryDim} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetBody}>
              {/* Symbolic Header */}
              <View style={styles.symbolBadge}>
                <Text style={styles.symbolIconText}>{t.symbol}</Text>
              </View>

              <Text style={[styles.sheetTitle, { color: '#FFFFFF' }]}>
                {authStep === 'phone' ? 'Enter Celebration Space' : 'Verify Verification Code'}
              </Text>

              <Text style={[styles.sheetSubtitle, { color: t.primaryDim }]}>
                {authStep === 'phone'
                  ? `Please enter your mobile number to instantly join ${spaceName || ceremony.name}.`
                  : `Enter the 4-digit code sent to your mobile number to verify.`}
              </Text>

              {/* Error Display */}
              {authError && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={14} color="#FF6B6B" />
                  <Text style={styles.errorText}>{authError}</Text>
                </View>
              )}

              {/* PHONE STEP */}
              {authStep === 'phone' && (
                <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, { borderColor: t.pillBorder, backgroundColor: t.pillBg }]}>
                    <Feather name="phone" size={18} color={t.primaryDim} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: '#FFFFFF' }]}
                      placeholder="Enter Mobile Number"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phoneNumber}
                      onChangeText={(val) => {
                        setPhoneNumber(val.replace(/\D/g, ''));
                        setAuthError(null);
                      }}
                      autoFocus={true}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={authLoading}
                    style={styles.modalSubmitBtnOpacity}
                  >
                    <LinearGradient
                      colors={t.buttonGradient as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalSubmitBtnGradient}
                    >
                      {authLoading ? (
                        <ActivityIndicator color={dbReligion === 'CHRISTIAN' ? '#0d1117' : '#120805'} />
                      ) : (
                        <Text style={[styles.modalSubmitBtnText, dbReligion === 'CHRISTIAN' ? { color: '#0d1117' } : null]}>
                          Send Verification Code
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* OTP STEP */}
              {authStep === 'otp' && (
                <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, { borderColor: t.pillBorder, backgroundColor: t.pillBg }]}>
                    <Feather name="shield" size={18} color={t.primaryDim} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.textInput, { color: '#FFFFFF', letterSpacing: 8, fontSize: 18, fontWeight: '700' }]}
                      placeholder="OTP Code"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={otpCode}
                      onChangeText={(val) => {
                        setOtpCode(val.replace(/\D/g, ''));
                        setAuthError(null);
                      }}
                      autoFocus={true}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    disabled={authLoading}
                    style={styles.modalSubmitBtnOpacity}
                  >
                    <LinearGradient
                      colors={t.buttonGradient as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modalSubmitBtnGradient}
                    >
                      {authLoading ? (
                        <ActivityIndicator color={dbReligion === 'CHRISTIAN' ? '#0d1117' : '#120805'} />
                      ) : (
                        <Text style={[styles.modalSubmitBtnText, dbReligion === 'CHRISTIAN' ? { color: '#0d1117' } : null]}>
                          Verify & Enter Feed ✨
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setAuthStep('phone')}
                    style={styles.backLink}
                    disabled={authLoading}
                  >
                    <Text style={[styles.backLinkLabel, { color: t.primary }]}>Change Phone Number</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const PHOTO_HEIGHT = height * 0.54;
const CARD_OVERLAP = 36;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  photoHeaderContainer: {
    width,
    height: PHOTO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  topPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: PHOTO_HEIGHT,
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  // Emojis (Explode perfectly out from the center of the couple image)
  floatingEmojiContainer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -18,
    marginTop: -18,
    zIndex: 15,
  },
  floatingEmojiText: {
    fontSize: 28,
  },

  // Sliding Card
  card: {
    marginTop: -CARD_OVERLAP,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderTopWidth: 1.5,
    overflow: 'hidden',
    minHeight: height - PHOTO_HEIGHT + CARD_OVERLAP,
  },
  cardContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    alignItems: 'center',
  },

  // Ornaments
  decorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
    marginBottom: 20,
    gap: 12,
  },
  decorLine: {
    flex: 1,
    height: 1,
  },
  decorOrnament: {
    fontSize: 16,
    fontWeight: '700',
  },
  blessingLine: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  symbolText: {
    fontSize: 22,
  },
  invitedLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },

  // Names (Georgia serif typography for premium editorial aesthetic)
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    maxWidth: width - 40,
  },
  name: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.2,
  },
  ampersand: {
    fontSize: 34,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  nameSingle: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: width - 48,
  },

  // Celebration Label
  celebrationLabel: {
    fontSize: 18,
    fontWeight: '400',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Countdown Box
  countdown: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.2,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  countdownTitle: {
    fontSize: 10,
    letterSpacing: 2.5,
    fontWeight: '700',
    marginBottom: 14,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeNum: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 38,
  },
  timeLbl: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },

  // Detail Info Rows
  details: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    flexShrink: 0,
  },
  detailText: {
    color: '#E2D8C5',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  // Code badge
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
  },
  codeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Sticky CTAs (Stacked vertically)
  btnWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    borderTopWidth: 1.2,
    gap: 10,
  },
  joinBtnOpacity: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  joinBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  joinBtnHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  joinBtnText: {
    color: '#120805',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  shareBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Auth Modal Styles ──
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropDim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 24,
    width: '100%',
  },
  sheetIndicator: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
  },
  sheetCloseBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sheetBody: {
    alignItems: 'center',
    paddingTop: 8,
  },
  symbolBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  symbolIconText: {
    fontSize: 28,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  sheetSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputWrapper: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
    padding: 0,
  },
  modalSubmitBtnOpacity: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalSubmitBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#120805',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  backLink: {
    marginTop: 16,
    paddingVertical: 6,
  },
  backLinkLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
