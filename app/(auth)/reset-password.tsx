import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { resetPasswordApi } from '../../src/services/api/authApi';
import {
  ArrowLeft,
  Lock,
  Key,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  LogIn,
} from 'lucide-react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();

  const [token, setToken] = useState(params.token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (params.token) {
      setToken(params.token);
    }
  }, [params.token]);

  // Real-time checks
  const isLengthValid = password.length >= 6;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;
  const isFormReady = token.trim().length > 0 && isLengthValid && doPasswordsMatch;

  const handleResetPassword = async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Please enter or paste your reset token');
      return;
    }

    if (!isLengthValid) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await resetPasswordApi({
        token: trimmedToken,
        password,
        confirmPassword,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.message || 'Failed to reset password. The link or token may have expired.');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Network error. Please check your internet connection.'
          : err.message || 'Failed to reset password. The link or token may have expired.');
      setError(msg);
    } finally {
      setLoading(false);
    }
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
        {/* Back Navigation Bar */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.text} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        {/* Brand / Header Icon */}
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={28} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <Text style={styles.screenTitle}>Set New Password</Text>
          <Text style={styles.screenSubtitle}>
            {params.email
              ? `Creating new password for ${params.email}`
              : 'Choose a secure password for your restaurant station'}
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <ShieldAlert size={18} color={Colors.rose} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!isSuccess ? (
          /* Form Card */
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Create New Credentials</Text>
            <Text style={styles.cardSubheading}>
              Enter the reset token received in your email, then choose and confirm your new password.
            </Text>

            {/* Token Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reset Verification Token</Text>
              <View style={styles.inputWrapper}>
                <Key size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Paste reset token from email"
                  placeholderTextColor={Colors.textMuted}
                  value={token}
                  onChangeText={(val) => {
                    setToken(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.tokenHint}>
                * Found in the reset link or email sent to your address
              </Text>
            </View>

            {/* New Password Input with Eye Icon */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm New Password Input with Eye Icon */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={Colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Validation Indicators */}
            <View style={styles.validationBox}>
              <View style={styles.validationRow}>
                <View
                  style={[
                    styles.validationDot,
                    isLengthValid && { backgroundColor: Colors.emerald, borderColor: Colors.emerald },
                  ]}
                >
                  {isLengthValid && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.validationText,
                    isLengthValid && { color: Colors.emerald, fontWeight: '700' },
                  ]}
                >
                  At least 6 characters long
                </Text>
              </View>

              <View style={styles.validationRow}>
                <View
                  style={[
                    styles.validationDot,
                    doPasswordsMatch && { backgroundColor: Colors.emerald, borderColor: Colors.emerald },
                  ]}
                >
                  {doPasswordsMatch && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.validationText,
                    doPasswordsMatch && { color: Colors.emerald, fontWeight: '700' },
                  ]}
                >
                  Passwords match
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, (!isFormReady || loading) && styles.submitBtnDisabled]}
              onPress={handleResetPassword}
              disabled={!isFormReady || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Update Password & Continue</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Success Card */
          <View style={styles.card}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={40} color={Colors.emerald} strokeWidth={2.4} />
            </View>

            <Text style={styles.successHeading}>Password Reset Successfully!</Text>
            <Text style={styles.successMessage}>
              Your restaurant admin credentials have been securely updated in the database. You can now sign in with your new password.
            </Text>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.8}
            >
              <View style={styles.btnContent}>
                <LogIn size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Sign In with New Password</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            🔐 Password securely encrypted with bcrypt & SHA-256
          </Text>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.roseLight,
    borderWidth: 1,
    borderColor: Colors.roseBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: Colors.rose,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  cardSubheading: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 19,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenHint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    marginLeft: 4,
  },
  validationBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.emeraldLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    marginTop: 28,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
