import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ImageBackground,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchDashboardSpaces, getEventImageSource } from '../services/api';

const { width, height } = Dimensions.get('window');

// ── Floating particle (copied from SplashScreen) ──────────────────────────────
const Particle = ({
  x, y, size, color, delay, duration,
}: {
  x: number; y: number; size: number; color: string; delay: number; duration: number;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay * 1000),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -80, duration: duration * 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(opacity,    { toValue: 0.45, duration: duration * 500, useNativeDriver: true }),
          Animated.timing(scale,      { toValue: 1,    duration: duration * 500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0,  duration: duration * 1000, useNativeDriver: true }),
          Animated.timing(opacity,    { toValue: 0,  duration: duration * 500,  useNativeDriver: true }),
          Animated.timing(scale,      { toValue: 0,  duration: duration * 500,  useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateY }, { scale }],
        opacity,
      }}
    />
  );
};

const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  x:        Math.random() * width,
  y:        Math.random() * height,
  size:     Math.random() * 4 + 2,
  color:    i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#B76E79' : '#FFC0CB',
  delay:    Math.random() * 2,
  duration: Math.random() * 5 + 4,
}));

// Imports are above
interface DashboardScreenProps {
  authToken: string | null;
  onSelectSpace: (space: any) => void;
  onCreateSpace: () => void;
  onLogout: () => void;
}

export default function DashboardScreen({ authToken, onSelectSpace, onCreateSpace, onLogout }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const [spaces, setSpaces] = useState([]);
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Staggered entrance animations
  const headerSlide    = useRef(new Animated.Value(-30)).current;
  const headerOpacity  = useRef(new Animated.Value(0)).current;
  const listOpacity    = useRef(new Animated.Value(0)).current;
  const fabScale       = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!authToken) return;
        const data = await fetchDashboardSpaces(authToken);
        
        if (data.user) {
          setUserName(data.user.name || '');
          setAvatarUrl(data.user.avatarUrl || null);

          if (data.user.guests) {
            const mappedSpaces = data.user.guests.map((g: any) => {
              let parsedTheme: any = {};
              try {
                if (g.space.theme) {
                  parsedTheme = typeof g.space.theme === 'string' ? JSON.parse(g.space.theme) : g.space.theme;
                }
              } catch (_) {}
              const starPhoto = parsedTheme?.keyPeople?.starPhoto || '';
              
              return {
                ...g.space,
                role: g.isAdmin ? 'HOST' : g.group || 'GUEST',
                coverUrl: starPhoto || g.space.coverUrl || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=3000&auto=format&fit=crop',
                date: new Date(g.space.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              };
            });
            setSpaces(mappedSpaces);
          }
        }
      } catch (e) {
        console.error("Failed to fetch spaces:", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Trigger animations
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(headerSlide, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.back(1)) }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(listOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(fabScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
    ]).start();
  }, [authToken]);

  // Dynamic formatting based on EventType
  const formatSpaceTitle = (space: any) => {
    const name = space.name || 'Your';
    switch (space.eventType) {
      case 'BIRTHDAY': return `${name}'s Birthday`;
      case 'ANNIVERSARY': return `${name}'s Anniversary`;
      case 'POOJA': return `The ${name} Family Pooja`;
      case 'GET_TOGETHER': return `${name} Get Together`;
      case 'WEDDING':
      default:
        return `${name}'s Celebration`;
    }
  };

  const renderSpaceCard = ({ item, index }: { item: any, index: number }) => {
    // Add minor staggered entry for cards using a dynamic spring scale or slide
    const cardScale = new Animated.Value(0.95);
    const cardFade = new Animated.Value(0);

    Animated.parallel([
      Animated.timing(cardFade, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 8, delay: index * 100, useNativeDriver: true })
    ]).start();

    return (
      <Animated.View style={{ opacity: cardFade, transform: [{ scale: cardScale }] }}>
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.85} 
          onPress={() => onSelectSpace(item)}
        >
          <ImageBackground 
            source={getEventImageSource(item.coverUrl)} 
            style={styles.cardImage}
            imageStyle={{ borderRadius: 20 }}
          >
            <LinearGradient
              colors={['rgba(24, 15, 10, 0.05)', 'rgba(24, 15, 10, 0.45)', 'rgba(24, 15, 10, 0.88)']}
              style={styles.cardOverlay}
            >
              <View style={styles.cardTopBar}>
                <View style={[styles.roleBadge, { backgroundColor: item.role === 'HOST' ? 'rgba(229,192,92,0.15)' : 'rgba(255,255,255,0.06)', borderColor: item.role === 'HOST' ? 'rgba(229,192,92,0.3)' : 'rgba(255,255,255,0.12)' }]}>
                  <Text style={[styles.roleText, { color: item.role === 'HOST' ? '#E5C05C' : '#FFFFFF' }]}>{item.role}</Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.eventSubtitle}>
                  {((item.eventType || 'WEDDING') + ' CELEBRATION').replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {(item.name || 'Celebration').replace(/'s\s+(Wedding|Celebration|Birthday|Anniversary)/gi, '')}
                </Text>
                <View style={styles.cardDateContainer}>
                  <Feather name="calendar" size={12} color="#E5C05C" />
                  <Text style={styles.cardDate}>  {item.date}</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Background with Particles (Splash Theme) ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#180A0A' }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(212,175,55,0.02)' }]} />
      
      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
      
      {/* ── Top Header with Entrance Animation ── */}
      <Animated.View style={[
        styles.header, 
        { 
          opacity: headerOpacity, 
          transform: [{ translateY: headerSlide }],
          paddingTop: Math.max(insets.top, 16) + 10
        }
      ]}>
        <View style={styles.headerTopRow}>
          {/* Ornamental divider instead of BlinkingStars */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.diamondsContainer}>
              <Text style={styles.dividerDiamond}>✦</Text>
              <Text style={styles.dividerDiamond}>✦</Text>
              <Text style={styles.dividerDiamond}>✦</Text>
            </View>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Feather name="log-out" size={18} color="#D4AF37" />
          </TouchableOpacity>
        </View>
        
        {/* Greeting row with avatar */}
        {userName ? (
          <View style={styles.greetingRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.greetingAvatar} />
            ) : (
              <View style={styles.greetingAvatarPlaceholder}>
                <Text style={styles.greetingAvatarInitial}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.greetingText}>Welcome back, <Text style={styles.goldText}>{userName}</Text> 👋</Text>
          </View>
        ) : null}

        <Text style={styles.headerTitle}>Your Spaces</Text>
        <Text style={styles.headerSubtitle}>SELECT A CELEBRATION TO ENTER</Text>
      </Animated.View>

      <Animated.View style={[styles.listContainer, { opacity: listOpacity }]}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#E5C05C" size="large" />
          </View>
        ) : spaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={40} color="rgba(212,175,55,0.4)" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>You haven't joined any celebrations yet.</Text>
          </View>
        ) : (
          <FlatList
            data={spaces}
            keyExtractor={(item) => item.id}
            renderItem={renderSpaceCard}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          />
        )}
      </Animated.View>

      {/* Floating Action Button (FAB) styled to match theme */}
      <Animated.View style={[
        styles.fabContainer, 
        { 
          bottom: Math.max(insets.bottom + 16, 24),
          transform: [{ scale: fabScale }]
        }
      ]}>
        <TouchableOpacity 
          style={styles.fabButton} 
          activeOpacity={0.8} 
          onPress={onCreateSpace}
        >
          <Feather name="plus" size={24} color="#1A0F0A" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#180A0A',
  },
  header: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    width: 60,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.4,
  },
  diamondsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dividerDiamond: {
    color: '#D4AF37',
    fontSize: 14,
    opacity: 0.8,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  greetingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  greetingAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingAvatarInitial: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '700',
  },
  greetingText: {
    fontSize: 15,
    color: 'rgba(255,255,240,0.7)',
    fontWeight: '500',
  },
  goldText: {
    color: '#E5C05C',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 48,
    color: '#E5C05C',
    fontFamily: 'serif',
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 240, 0.6)',
    letterSpacing: 3,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    zIndex: 10,
  },
  flatListContent: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 120,
    gap: 28,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: 'rgba(255,255,240,0.45)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 192, 92, 0.15)',
    backgroundColor: '#1E0F0D',
    ...Platform.select({
      ios: {
        shadowColor: '#E5C05C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardTopBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cardContent: {
    width: '100%',
  },
  eventSubtitle: {
    color: '#E5C05C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardTitle: {
    color: '#FDFBF7',
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  cardDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 192, 92, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(229, 192, 92, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardDate: {
    color: '#E5C05C',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fabContainer: {
    position: 'absolute',
    right: 28,
    zIndex: 999,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#8C7238',
    borderWidth: 1,
    borderColor: '#A88D4D',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
