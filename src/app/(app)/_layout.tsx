import { Stack } from 'expo-router';

import { useAppTheme } from '@/hooks/use-app-theme';

export default function AppLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Meu Cofre' }} />
    </Stack>
  );
}
