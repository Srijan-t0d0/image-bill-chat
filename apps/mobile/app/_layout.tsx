import '@ungap/structured-clone';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
