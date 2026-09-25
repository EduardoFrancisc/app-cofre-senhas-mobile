import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '🔐 Meu Cofre',
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#F1F5F9',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
    </Stack>
  );
}
