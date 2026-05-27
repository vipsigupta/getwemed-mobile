import React, { useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import axios from 'axios';

// ── App Screens ───────────────────────────────────────────────────────────────
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InvitationScreen from '../screens/InvitationScreen';
import CreateEventScreen from '../screens/CreateEventScreen';

const API_BASE = 'https://getmewed-backend.vercel.app/v1';

type Route =
  | 'SPLASH'
  | 'ONBOARDING'   // Guest entering an invite code
  | 'LOGIN'        // Host / admin login (phone)
  | 'OTP'
  | 'PROFILE_SETUP'
  | 'DASHBOARD'
  | 'INVITATION'   // Event landing page
  | 'CREATE_EVENT';

export default function RootLayout() {
  const [route, setRoute]         = useState<Route>('SPLASH');
  const [phone, setPhone]         = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const go = (r: Route) => setRoute(r);

  // ── OTP verify: call backend with mock token pattern ──────────────────────
  const handleVerifyOtp = async (otp: string) => {
    try {
      // Use phone+OTP as a deterministic mock Firebase UID for dev/demo
      const mockUid = `${phone.replace(/\D/g, '')}_${otp}`;
      const mockToken = `mock_firebase_token_${mockUid}`;

      // Call backend /auth/session to create/find user
      const res = await axios.get(`${API_BASE}/auth/session`, {
        headers: { Authorization: `Bearer ${mockToken}` },
      });

      setAuthToken(mockToken);

      // If user has no name yet → profile setup, else dashboard
      const hasName = res.data?.user?.name?.trim();
      go(hasName ? 'DASHBOARD' : 'PROFILE_SETUP');
    } catch (err) {
      console.error('OTP verify error:', err);
      // Even on error go to profile setup (dev mode)
      const mockToken = `mock_firebase_token_${phone.replace(/\D/g, '')}9999999999`;
      setAuthToken(mockToken);
      go('PROFILE_SETUP');
    }
  };

  // ── Profile save ──────────────────────────────────────────────────────────
  const handleProfileContinue = async (name: string, avatarUri?: string) => {
    if (!authToken) { go('DASHBOARD'); return; }
    setProfileLoading(true);
    try {
      await axios.patch(
        `${API_BASE}/auth/profile`,
        { name },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
    } catch (e) {
      console.warn('Profile save failed (continuing):', e);
    } finally {
      setProfileLoading(false);
      go('DASHBOARD');
    }
  };

  // ── SPLASH ────────────────────────────────────────────────────────────────
  if (route === 'SPLASH') {
    return (
      <SafeAreaProvider>
        <SplashScreen onNext={() => go('ONBOARDING')} />
      </SafeAreaProvider>
    );
  }

  // ── ONBOARDING  (guest: enter invite code) ────────────────────────────────
  if (route === 'ONBOARDING') {
    return (
      <SafeAreaProvider>
        <OnboardingScreen
          onSuccess={(space: any) => {
            // Guest found the space — show invitation directly
            setSelectedSpace(space);
            go('INVITATION');
          }}
          onBack={() => go('SPLASH')}
        />
      </SafeAreaProvider>
    );
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if (route === 'LOGIN') {
    return (
      <SafeAreaProvider>
        <LoginScreen
          onSendOtp={(p: string) => { setPhone(p); go('OTP'); }}
          onBack={() => go('SPLASH')}
        />
      </SafeAreaProvider>
    );
  }

  // ── OTP ───────────────────────────────────────────────────────────────────
  if (route === 'OTP') {
    return (
      <SafeAreaProvider>
        <OtpScreen
          phone={phone}
          onVerify={handleVerifyOtp}
          onBack={() => go('LOGIN')}
        />
      </SafeAreaProvider>
    );
  }

  // ── PROFILE SETUP ─────────────────────────────────────────────────────────
  if (route === 'PROFILE_SETUP') {
    return (
      <SafeAreaProvider>
        <ProfileSetupScreen
          onContinue={handleProfileContinue}
          loading={profileLoading}
        />
      </SafeAreaProvider>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  if (route === 'DASHBOARD') {
    return (
      <SafeAreaProvider>
        <DashboardScreen
          authToken={authToken}
          onSelectSpace={(space: any) => { setSelectedSpace(space); go('INVITATION'); }}
          onCreateSpace={() => go('CREATE_EVENT')}
          onLogout={() => { setAuthToken(null); go('SPLASH'); }}
        />
      </SafeAreaProvider>
    );
  }

  // ── INVITATION ────────────────────────────────────────────────────────────
  if (route === 'INVITATION') {
    return (
      <SafeAreaProvider>
        <InvitationScreen
          space={selectedSpace}
          onJoin={() => go('DASHBOARD')}
          onBack={() => go('DASHBOARD')}
        />
      </SafeAreaProvider>
    );
  }

  // ── CREATE EVENT ──────────────────────────────────────────────────────────
  if (route === 'CREATE_EVENT') {
    return (
      <SafeAreaProvider>
        <CreateEventScreen
          authToken={authToken}
          onBack={() => go('DASHBOARD')}
          onEventCreated={(eventData: any) => {
            setSelectedSpace(eventData);
            go('INVITATION');
          }}
        />
      </SafeAreaProvider>
    );
  }

  return null;
}
