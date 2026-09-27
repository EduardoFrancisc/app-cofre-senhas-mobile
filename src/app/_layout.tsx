import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/contexts/AuthContext';
import { themes } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/utils/splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: isDark ? themes.dark.background : themes.light.background,
      card: isDark ? themes.dark.background : themes.light.background,
      text: isDark ? themes.dark.text : themes.light.text,
      border: isDark ? themes.dark.border : themes.light.border,
      primary: isDark ? themes.dark.primary : themes.light.primary,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { token, isLoading } = useAuth();

  // O SplashScreen fica visível até sabermos se há sessão ativa, evitando
  // mostrar a tela de login para quem já está autenticado.
  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <>
      {/*
        `Stack.Protected` remove as rotas cujo guard é falso do histórico e
        redireciona automaticamente — inclusive em deep links. Isso substitui o
        `router.replace()` manual dentro de um `useEffect`, que causava
        tela em branco e corrida entre os dois efeitos.
      */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Protected guard={Boolean(token)}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>

        <Stack.Protected guard={!token}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
