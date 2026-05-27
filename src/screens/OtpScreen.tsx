import React, { useState, useRef } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface OtpScreenProps {
  phone: string;
  onVerify: (otp: string) => void;
  onBack: () => void;
}

export default function OtpScreen({ phone, onVerify, onBack }: OtpScreenProps) {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const otpComplete = otp.every(d => d !== '');

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next box
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
    // Auto-submit when 4th digit is entered
    if (index === 3 && value) {
      const fullCode = [...newOtp.slice(0, 3), value].join('');
      if (fullCode.length === 4) {
        setLoading(true);
        setTimeout(() => onVerify(fullCode), 500);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length === 4 && !loading) {
      setLoading(true);
      setTimeout(() => onVerify(code), 500);
    }
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
          
          <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={loading}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 60}
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

              <Text style={styles.tagline}>VERIFY YOUR IDENTITY</Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.promptText}>
                Code sent to <Text style={styles.goldText}>+91 {phone}</Text>
              </Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputs.current[index] = ref; }}
                    style={[styles.otpBox, digit !== '' && styles.otpBoxFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text.replace(/[^0-9]/g, ''), index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    autoFocus={index === 0}
                    editable={!loading}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.button, otpComplete ? styles.buttonActive : styles.buttonDim, loading && styles.buttonDisabled]} 
                onPress={handleVerify}
                disabled={loading || !otpComplete}
              >
                {loading ? (
                  <ActivityIndicator color="#1A0F0A" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={[styles.buttonText, otpComplete && styles.buttonTextActive]}>Verify & Enter</Text>
                    <Feather name="arrow-right" size={20} color={otpComplete ? '#1A0F0A' : 'rgba(26,15,10,0.5)'} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.changeNumberBtn} onPress={onBack}>
                <Text style={styles.changeNumberText}>Change Number</Text>
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
  backButton: {
    marginTop: 60,
    zIndex: 10,
  },
  backButtonText: {
    color: 'rgba(255,255,240,0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 50,
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
  goldText: {
    color: '#E5C05C',
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    marginBottom: 24,
  },
  otpBox: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(20, 10, 5, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#A88D4D',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
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
  changeNumberBtn: {
    padding: 10,
  },
  changeNumberText: {
    color: '#8B733D',
    fontSize: 14,
    fontWeight: '500',
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
