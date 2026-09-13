import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="signup" options={{ headerShown: true, title: 'Sign Up' }} />
        <Stack.Screen name="login" options={{ headerShown: true, title: 'Log In' }} />
        <Stack.Screen name="new-project" options={{ headerShown: true, title: 'New Project' }} />
        <Stack.Screen name="project/[id]" options={{ headerShown: true, title: 'Project' }} />
        <Stack.Screen name="approvals" options={{ headerShown: true, title: 'Approvals' }} />
      </Stack>
    </ThemeProvider>
  );
}