import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  ImageBackground,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchSpaceByInviteCode } from '../services/api';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onSuccess: (space: any) => void;
  onBack: () => void;
}

export default function OnboardingScreen({ onSuccess, onBack }: OnboardingScreenProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (code.trim().length < 4) {
      setError('Please enter a valid invite code.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const space = await fetchSpaceByInviteCode(code.trim());
      onSuccess(space);
    } catch (err) {
      setError('Invalid or expired invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=3000&auto=format&fit=crop' }} 
        style={styles.backgroundImage}
        blurRadius={10} // Blur the background for focus on the form
      >
        <View style={styles.overlay}>
          
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.card}>
              <View style={styles.decorativeRow}>
                <View style={styles.line} />
                <Text style={styles.diamond}>✦</Text>
                <View style={styles.line} />
              </View>

              <Text style={styles.title}>Enter Invite Code</Text>
              <Text style={styles.subtitle}>
                You can find this code on your physical or digital invitation card.
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. AMAN2026"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text.toUpperCase());
                    setError('');
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity 
                style={[styles.joinButton, loading && styles.joinButtonDisabled]} 
                onPress={handleJoin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#1A0F0A" />
                ) : (
                  <Text style={styles.joinButtonText}>Unlock Space ✨</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  backgroundImage: {
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 5, 0, 0.75)', 
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: height * 0.08,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(26, 15, 10, 0.85)', // Dark chocolate
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    width: '100%',
  },
  decorativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  line: {
    height: 1,
    width: 40,
    backgroundColor: '#D4AF37', 
    marginHorizontal: 15,
  },
  diamond: {
    color: '#D4AF37',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 35,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    color: '#E5C05C',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
  },
  errorText: {
    color: '#D98A8A', // Rose gold error
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#E5C05C',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    color: '#1A0F0A',
    fontSize: 16,
    fontWeight: '700',
  }
});
