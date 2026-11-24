import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/constants/theme';
import { PRESET_ROLES } from '../../src/constants/roles';
import { UtensilsCrossed, Lock, Mail, ShieldAlert, Sparkles, ChevronRight } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsDemoRole, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    clearError();
    const success = await login(email, password);
    if (success) {
      router.replace('/(app)');
    }
  };

  const handleDemoLogin = async (roleId: string) => {
    clearError();
    await loginAsDemoRole(roleId);
    router.replace('/(app)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.iconCircle}>
            <UtensilsCrossed size={32} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <Text style={styles.brandTitle}>Tablly</Text>
          <Text style={styles.brandTagline}>Restaurant Operations & Staff Station</Text>
        </View>

        {/* Error Alert */}
        {error && (
          <View style={styles.errorBanner}>
            <ShieldAlert size={18} color={Colors.rose} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Sign In to Station</Text>
          <Text style={styles.cardSubheading}>
            Enter your credentials or choose your assigned role below
          </Text>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Staff Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="staff@restaurant.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.primaryButton, (!email || !password || isLoading) && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!email || !password || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Demo Switcher Section */}
        <View style={styles.demoSection}>
          <View style={styles.demoSectionHeader}>
            <Sparkles size={16} color={Colors.primary} />
            <Text style={styles.demoSectionTitle}>Test Any Role in 1 Tap</Text>
          </View>
          <Text style={styles.demoSectionSubtitle}>
            Tap a role to see how the app dynamically filters menus and permissions:
          </Text>

          <View style={styles.roleGrid}>
            {PRESET_ROLES.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleCard, { borderColor: role.color + '40' }]}
                onPress={() => handleDemoLogin(role.id)}
                activeOpacity={0.7}
              >
                <View style={styles.roleCardContent}>
                  <View style={[styles.roleDot, { backgroundColor: role.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roleName}>{role.name}</Text>
                    <Text style={styles.roleDesc} numberOfLines={1}>
                      {role.description}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.roseLight,
    borderColor: Colors.roseBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: Colors.rose,
    fontSize: 13,
    flex: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSubheading: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 28,
  },
  demoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  demoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  demoSectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  roleGrid: {
    gap: 8,
  },
  roleCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  roleDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
