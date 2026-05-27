import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ImageBackground,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

const EVENTS = [
  { label: 'Weddings',     emoji: '💍' },
  { label: 'Sangeet',      emoji: '🎵' },
  { label: 'Mehendi',      emoji: '🌿' },
  { label: 'Engagements',  emoji: '💫' },
  { label: 'Birthdays',    emoji: '🎂' },
  { label: 'Anniversaries',emoji: '❤️' },
];

// ── Floating particle (one animated dot) ──────────────────────────────────────
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
          Animated.timing(translateY, { toValue: -70, duration: duration * 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
          Animated.timing(opacity,    { toValue: 0.55, duration: duration * 500, useNativeDriver: true }),
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

// ── Animated pill badge ───────────────────────────────────────────────────────
const EventPill = ({ label, emoji, isActive }: { label: string; emoji: string; isActive: boolean }) => {
  const bg     = useRef(new Animated.Value(0)).current;
  const border = useRef(new Animated.Value(0)).current;
  const sc     = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Scale: native driver ✓
    Animated.spring(sc, {
      toValue: isActive ? 1.07 : 1,
      useNativeDriver: true,
    }).start();
    // Colors: JS driver ✓ (color interpolations can't use native driver)
    Animated.timing(bg,     { toValue: isActive ? 1 : 0, duration: 350, useNativeDriver: false }).start();
    Animated.timing(border, { toValue: isActive ? 1 : 0, duration: 350, useNativeDriver: false }).start();
  }, [isActive]);

  const bgColor     = bg.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,240,0.05)', 'rgba(212,175,55,0.2)'] });
  const borderColor = border.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,240,0.1)', 'rgba(212,175,55,0.55)'] });
  const textColor   = isActive ? '#D4AF37' : 'rgba(255,255,240,0.4)';

  return (
    // Outer view: native-driven scale only
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      {/* Inner view: JS-driven color only */}
      <Animated.View style={[styles.pill, { backgroundColor: bgColor, borderColor }]}>
        <Text style={styles.pillEmoji}>{emoji}</Text>
        <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
};

// ── Loading dot ───────────────────────────────────────────────────────────────
const LoadingDot = ({ delay }: { delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay * 1000),
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });

  return (
    <Animated.View style={[styles.dot, { opacity, transform: [{ scale }] }]} />
  );
};

// ── Pre-generate particles so they don't randomise on re-render ───────────────
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  x:        Math.random() * width,
  y:        Math.random() * height,
  size:     Math.random() * 4 + 2,
  color:    i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#B76E79' : '#FFC0CB',
  delay:    Math.random() * 3,
  duration: Math.random() * 4 + 3,
}));

// ── Main Component ────────────────────────────────────────────────────────────
export default function SplashScreen({ onNext }: { onNext?: () => void }) {
  const [activeEvent, setActiveEvent] = useState(0);

  // Staggered entrance animations
  const dividerScale  = useRef(new Animated.Value(0)).current;
  const dividerOpacity= useRef(new Animated.Value(0)).current;
  const titleSlide    = useRef(new Animated.Value(30)).current;
  const titleOpacity  = useRef(new Animated.Value(0)).current;
  const taglineOpacity= useRef(new Animated.Value(0)).current;
  const pillsOpacity  = useRef(new Animated.Value(0)).current;
  const pillsSlide    = useRef(new Animated.Value(12)).current;
  const dotsOpacity   = useRef(new Animated.Value(0)).current;
  const quoteOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.sequence([
      // 1 — ornamental divider
      Animated.parallel([
        Animated.timing(dividerScale,   { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(dividerOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      // 2 — title
      Animated.parallel([
        Animated.timing(titleSlide,   { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
      // 3 — tagline
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      // 4 — pills + dots + quote
      Animated.parallel([
        Animated.timing(pillsOpacity,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pillsSlide,    { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(dotsOpacity,   { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
        Animated.timing(quoteOpacity,  { toValue: 1, duration: 500, delay: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Pill cycling
    const pillInterval = setInterval(() => {
      setActiveEvent((prev) => (prev + 1) % EVENTS.length);
    }, 700);

    // Auto-navigate after 4s
    const navTimer = setTimeout(() => { onNext?.(); }, 4000);

    return () => {
      clearInterval(pillInterval);
      clearTimeout(navTimer);
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* ── Dark maroon background with subtle glow ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#180A0A' }]} />
      {/* Simulate a subtle radial glow in the center */}
      <View style={[
        StyleSheet.absoluteFill,
        { backgroundColor: 'rgba(212,175,55,0.03)' }
      ]} />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* ── Main content ── */}
      <View style={styles.content}>

        {/* Ornamental divider */}
        <Animated.View style={[styles.divider, { opacity: dividerOpacity, transform: [{ scaleX: dividerScale }] }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerDiamond}>✦</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Title: Celebration / Space */}
        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleSlide }] }}>
          <Text style={styles.titleWhite}>Celebration</Text>
          <Text style={styles.titleGold}>Space</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          LIVE · CELEBRATE · REMEMBER
        </Animated.Text>

        {/* Event pills (3-2-1 Layout) */}
        <Animated.View style={[styles.pillsSection, { opacity: pillsOpacity, transform: [{ translateY: pillsSlide }] }]}>
          <Text style={styles.pillsSectionLabel}>FOR EVERY MILESTONE</Text>
          
          <View style={styles.pillsRow}>
            {EVENTS.slice(0, 3).map((ev, i) => (
              <EventPill key={ev.label} label={ev.label} emoji={ev.emoji} isActive={activeEvent === i} />
            ))}
          </View>
          <View style={styles.pillsRow}>
            {EVENTS.slice(3, 5).map((ev, i) => (
              <EventPill key={ev.label} label={ev.label} emoji={ev.emoji} isActive={activeEvent === (i + 3)} />
            ))}
          </View>
          <View style={styles.pillsRow}>
            {EVENTS.slice(5, 6).map((ev, i) => (
              <EventPill key={ev.label} label={ev.label} emoji={ev.emoji} isActive={activeEvent === (i + 5)} />
            ))}
          </View>
        </Animated.View>

        {/* Loading dots */}
        <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
          <LoadingDot delay={0} />
          <LoadingDot delay={0.2} />
          <LoadingDot delay={0.4} />
        </Animated.View>

      </View>

      {/* ── Bottom quote ── */}
      <Animated.View style={[styles.bottomQuote, { opacity: quoteOpacity }]}>
        <Text style={styles.quoteText}>"Where every moment becomes a memory"</Text>
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0502',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Overlays
  overlayTop: {
    backgroundColor: 'rgba(10,5,2,0.5)',
  },
  overlayBottom: {
    backgroundColor: 'rgba(10,5,2,0.95)',
    top: '60%' as any,
  },
  overlayGold: {
    backgroundColor: 'rgba(212,175,55,0.06)',
  },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  dividerLine: {
    width: 64,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.6,
  },
  dividerDiamond: {
    color: '#D4AF37',
    fontSize: 18,
  },

  // Title
  titleWhite: {
    fontSize: 54,
    fontWeight: '800',
    fontFamily: 'serif',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 60,
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  titleGold: {
    fontSize: 54,
    fontWeight: '800',
    fontFamily: 'serif',
    color: '#E5C05C',
    textAlign: 'center',
    lineHeight: 60,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  // Tagline
  tagline: {
    color: 'rgba(255,255,240,0.5)',
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '400',
    marginTop: 24,
    marginBottom: 40,
    textAlign: 'center',
  },

  // Pills
  pillsSection: {
    alignItems: 'center',
    marginBottom: 36,
    width: '100%',
  },
  pillsSectionLabel: {
    color: 'rgba(255,255,240,0.4)',
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  pillEmoji: {
    fontSize: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
  },

  // Bottom quote
  bottomQuote: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  quoteText: {
    color: 'rgba(212,175,55,0.45)',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
});
