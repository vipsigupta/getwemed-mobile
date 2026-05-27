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
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';


interface ProfileSetupScreenProps {
  onContinue: (name: string, avatarUri?: string) => void;
  loading?: boolean;
}

export default function ProfileSetupScreen({ onContinue, loading = false }: ProfileSetupScreenProps) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const handlePickPhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to add a profile photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images' as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const isReady = name.trim().length > 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=3000&auto=format&fit=crop' }} 
        style={styles.backgroundImage}
        blurRadius={4}
      >
        <View style={styles.overlayGradient} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          <View style={styles.scrollContent}>
            {/* Header */}
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
                <Text style={styles.titleGold}>Your Profile</Text>
              </View>

              <Text style={styles.tagline}>LET EVERYONE KNOW WHO'S CELEBRATING</Text>
            </View>

            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity 
                style={styles.avatarCircle} 
                activeOpacity={0.8}
                onPress={handlePickPhoto}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Feather name="user" size={40} color="#D4AF37" />
                )}
                <View style={styles.cameraBadge}>
                  <Feather name="camera" size={14} color="#1A0F0A" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarText}>
                {avatarUri ? 'Tap to change photo' : 'Tap to add a photo'}
              </Text>
            </View>

            {/* Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <View style={[styles.inputWrapper, name.trim() && styles.inputWrapperActive]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={name}
                  onChangeText={setName}
                  selectionColor="#E5C05C"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Continue Button — flows naturally below the input */}
            <TouchableOpacity 
              style={[styles.button, isReady ? styles.buttonActive : styles.buttonDim, { marginTop: 28 }]} 
              onPress={() => onContinue(name, avatarUri ?? undefined)}
              disabled={!isReady || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#1A0F0A" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={[styles.buttonText, isReady && styles.buttonTextActive]}>
                    Continue
                  </Text>
                  <Feather name="arrow-right" size={20} color={isReady ? '#1A0F0A' : 'rgba(26,15,10,0.4)'} />
                </View>
              )}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    // No flex:1
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -20,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(26, 15, 10, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#E5C05C',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A0F0A',
  },
  avatarText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
  inputSection: {
    width: '100%',
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputWrapper: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(20, 10, 5, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    overflow: 'hidden',
  },
  inputWrapperActive: {
    borderColor: '#A88D4D',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  input: {
    flex: 1,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    paddingHorizontal: 16,
    letterSpacing: 1,
  },
  bottomSection: {
    paddingTop: 12,
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
});
