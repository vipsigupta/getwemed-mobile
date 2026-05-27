import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onSendOtp: (phone: string) => void;
  onBack: () => void;
}

export default function LoginScreen({ onSendOtp, onBack }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isPhoneReady = phone.length === 10;

  const handleNext = () => {
    Keyboard.dismiss();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSendOtp(phone || '9999999999');
    }, 400);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* ── Background Image with Gradients ── */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=3000&auto=format&fit=crop' }} 
        style={styles.backgroundImage}
        blurRadius={4}
      >
        <View style={styles.overlayGradient} />

        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <View style={styles.headerContainer}>
              {/* Ornamental divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <View style={styles.diamondsContainer}>
                  <Text style={styles.dividerDiamond}>✦</Text>
                  <Text style={styles.dividerDiamond}>✦</Text>
                  <Text style={styles.dividerDiamond}>✦</Text>
                </View>
                <View style={styles.dividerLine} />
              </View>

              {/* Title */}
              <View>
                <Text style={styles.titleGold}>Wedding Space</Text>
              </View>

              <Text style={styles.tagline}>YOUR INVITATION AWAITS</Text>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.promptText}>
                Enter your mobile number to join the celebrations
              </Text>
              
              <View style={styles.inputWrapper}>
                <View style={styles.countryCode}>
                  <Text style={styles.flagEmoji}>🇮🇳</Text>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor="rgba(255, 255, 255, 0.2)"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(val) => setPhone(val.replace(/[^0-9]/g, ''))}
                  selectionColor="#E5C05C"
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, isPhoneReady && !loading ? styles.buttonActive : styles.buttonDim]} 
                onPress={handleNext}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#1A0F0A" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={[styles.buttonText, isPhoneReady && styles.buttonTextActive]}>Send OTP</Text>
                    <Feather name="arrow-right" size={20} color={isPhoneReady ? '#1A0F0A' : 'rgba(26,15,10,0.5)'} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>

          <Text style={[styles.footerText, { bottom: Math.max(insets.bottom, 20) }]}>
            By continuing you agree to our terms of{'\n'}celebration
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0F0A',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 15, 10, 0.85)',
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 28,
    zIndex: 10,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: -40,
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  dividerLine: {
    width: 70,
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

  // Title
  titleGold: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'serif',
    color: '#E5C05C',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },

  // Tagline
  tagline: {
    color: 'rgba(255,255,240,0.6)',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  inputSection: {
    width: '100%',
    alignItems: 'center',
  },
  promptText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '400',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(20, 10, 5, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 24,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(212, 175, 55, 0.15)',
    height: '100%',
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  countryCodeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: '100%',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    paddingHorizontal: 16,
    letterSpacing: 1,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDim: {
    backgroundColor: 'rgba(139, 115, 61, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  buttonActive: {
    backgroundColor: '#8C7238',
    borderWidth: 1,
    borderColor: '#A88D4D',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'rgba(26, 15, 10, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#1A0F0A',
    fontWeight: '700',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
    alignSelf: 'center',
    lineHeight: 18,
  }
});
