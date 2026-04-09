import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useProfileStore } from '../store/profileStore';

export default function RootLayout() {
  const { isLoaded, loadProfile, isProfileComplete } = useProfileStore();
  const segments = useSegments();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadProfile().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;

    const onOnboarding = segments[0] === 'onboarding';
    const profileDone = isProfileComplete();

    if (!profileDone && !onOnboarding) {
      router.replace('/onboarding');
    } else if (profileDone && onOnboarding) {
      router.replace('/');
    }
  }, [ready, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1f2937',
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{ title: 'Setup', headerBackVisible: false }}
        />
        <Stack.Screen
          name="index"
          options={{ title: 'Bill Scanner' }}
        />
        <Stack.Screen
          name="processing"
          options={{
            title: 'Processing...',
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="bill-editor"
          options={{ title: 'Edit Invoice' }}
        />
        <Stack.Screen
          name="pdf-preview"
          options={{ title: 'Invoice PDF' }}
        />
      </Stack>
    </>
  );
}
