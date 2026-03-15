import { Stack } from 'expo-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#222',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'My Diary' }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: 'Search Foods',
            presentation: 'modal',
          }}
        />
      </Stack>
    </ConvexProvider>
  );
}
