import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import OtpScreen from './src/screens/OtpScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InvitationScreen from './src/screens/InvitationScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import { fetchDashboardSpaces, updateProfile, uploadAvatar } from './src/services/api';

// Safe AsyncStorage wrapper to prevent crashes in Expo Go or Web if native module is missing
const memoryStorage = {};
const safeStorage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') return window.localStorage.getItem(key);
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  }
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [authToken, setAuthToken] = useState(null);
  const [activePhone, setActivePhone] = useState('');
  const [selectedSpace, setSelectedSpace] = useState(null);

  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const token = await safeStorage.getItem('authToken');
        if (token) {
          setAuthToken(token);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkAuthSession();
  }, []);

  const handleSplashNext = () => {
    if (authToken) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('login');
    }
  };

  const handleSendOtp = (phone) => {
    setActivePhone(phone);
    setCurrentScreen('otp');
  };

  const handleVerifyOtp = async (otp) => {
    // Encode the actual phone number into the mock token.
    // Backend will extract it and find/create the right user.
    const phone = activePhone || '9999999999';
    const mockToken = `mock_firebase_token_${phone}`;
    await safeStorage.setItem('authToken', mockToken);
    setAuthToken(mockToken);

    try {
      // Check the backend to see if this user has already set up their profile
      const session = await fetchDashboardSpaces(mockToken);
      const isNewUser = session?.user?.isNewUser;
      
      if (isNewUser) {
        setCurrentScreen('profile_setup');
      } else {
        setCurrentScreen('dashboard');
      }
    } catch (e) {
      console.warn('Session fetch failed, defaulting to profile setup:', e?.message);
      setCurrentScreen('profile_setup');
    }
  };

  const handleProfileSetup = async (name, avatarUri) => {
    try {
      let avatarUrl;

      // Step 1: Upload photo to Supabase Storage via backend (if user picked one)
      if (avatarUri && authToken) {
        try {
          avatarUrl = await uploadAvatar(authToken, avatarUri);
        } catch (uploadErr) {
          console.warn('Avatar upload failed, continuing without photo:', uploadErr?.message);
        }
      }

      // Step 2: Save name (and public avatar URL) to the user profile
      if (authToken) {
        await updateProfile(authToken, name, avatarUrl);
      }
      setCurrentScreen('dashboard');
    } catch (e) {
      console.error('Failed to update profile', e);
      setCurrentScreen('dashboard');
    }
  };

  const handleSelectSpace = (space) => {
    setSelectedSpace(space);
    setCurrentScreen('invite');
  };

  if (currentScreen === 'splash') {
    return <SplashScreen onNext={handleSplashNext} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onSendOtp={handleSendOtp} />;
  }

  if (currentScreen === 'otp') {
    return (
      <OtpScreen 
        phone={activePhone} 
        onVerify={handleVerifyOtp} 
        onBack={() => setCurrentScreen('login')} 
      />
    );
  }

  if (currentScreen === 'profile_setup') {
    return <ProfileSetupScreen onContinue={handleProfileSetup} />;
  }

  if (currentScreen === 'dashboard') {
    return (
      <DashboardScreen 
        authToken={authToken}
        onSelectSpace={handleSelectSpace} 
        onCreateSpace={() => setCurrentScreen('create_event')}
        onLogout={() => {
          safeStorage.setItem('authToken', '');
          setAuthToken(null);
          setCurrentScreen('splash');
        }}
      />
    );
  }

  if (currentScreen === 'create_event') {
    return (
      <CreateEventScreen 
        authToken={authToken}
        onBack={() => setCurrentScreen('dashboard')}
        onEventCreated={(newEvent) => {
          // Navigate to invitation page of the new event
          handleSelectSpace(newEvent);
        }}
      />
    );
  }

  if (currentScreen === 'invite') {
    return (
      <InvitationScreen 
        space={selectedSpace} 
        onJoin={() => setCurrentScreen('feed')} 
        onBack={() => setCurrentScreen('dashboard')}
      />
    );
  }

  if (currentScreen === 'feed') {
    return (
      <View style={styles.dashboard}>
        <Text style={styles.dashboardTitle}>
          Welcome to the Live Feed!
        </Text>
        <Text style={styles.dashboardSubtitle}>
          Real-time Socket.io events will stream here.
        </Text>
      </View>
    );
  }

  return null;
}
const styles = StyleSheet.create({
  dashboard: {
    flex: 1, 
    backgroundColor: '#050505', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  dashboardTitle: {
    color: '#D4AF37', 
    fontSize: 28, 
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: 10,
  },
  dashboardSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  }
});
