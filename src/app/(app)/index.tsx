import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

export default function VaultScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>Olá, {user?.name ?? 'usuário'} 👋</Text>
          <Text style={styles.subtitle}>Seu cofre está seguro.</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🗝️</Text>
          <Text style={styles.emptyTitle}>Nenhuma senha cadastrada</Text>
          <Text style={styles.emptySubtitle}>
            Toque em "+" para adicionar sua primeira entrada.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 24,
  },
  welcome: {
    gap: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
