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
import { Colors } from '../../src/constants/theme';
import { requestPasswordResetApi } from '../../src/services/api/authApi';
import {
  ArrowLeft,
  Mail,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  Send,
  ArrowRight,
} from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleSendReset = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your registered email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await requestPasswordResetApi(trimmed);
      setSubmittedEmail(trimmed);
      setIsSubmitted(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Network error. Please check your internet connection.'
          : err.message || 'Failed to send reset link. Please try again.');
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
          <Text style={styles.backBtnText}>Back to Sign In</Text>
        </TouchableOpacity>

        {/* Brand / Header Icon */}
        <View style={styles.headerBox}>
          <View style={styles.iconCircle}>
            <KeyRound size={28} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <Text style={styles.screenTitle}>Password Recovery</Text>
          <Text style={styles.screenSubtitle}>
            Reset your restaurant admin or staff station access credentials
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <ShieldAlert size={18} color={Colors.rose} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!isSubmitted ? (
          /* Input Form Card */
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Forgot Password?</Text>
            <Text style={styles.cardSubheading}>
              Enter your registered staff email address below. We'll send you a password reset link and verification token.
            </Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Staff / Admin Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="admin@restaurant.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, (!email.trim() || loading) && styles.submitBtnDisabled]}
              onPress={handleSendReset}
              disabled={!email.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Send Reset Link</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Direct Token Link */}
            <View style={styles.tokenLinkRow}>
              <Text style={styles.tokenPromptText}>Already have a reset token?</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/reset-password')}
                activeOpacity={0.7}
              >
                <Text style={styles.tokenLinkText}>Enter Token & Set Password →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Success Card */
          <View style={styles.card}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={36} color={Colors.emerald} strokeWidth={2.4} />
            </View>

            <Text style={styles.successHeading}>Reset Instructions Dispatched</Text>
            <Text style={styles.successMessage}>
              If an account is associated with <Text style={{ fontWeight: '700', color: Colors.text }}>{submittedEmail}</Text>, a password reset link and verification token have been sent to your inbox.
            </Text>

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 What to do next:</Text>
              <Text style={styles.tipText}>
                1. Open your email inbox and copy the reset token from the email.
              </Text>
              <Text style={styles.tipText}>
                2. Tap the button below to enter your token and choose a new password.
              </Text>
              <Text style={[styles.tipText, { marginTop: 4, color: Colors.textMuted }]}>
                * Check your Spam / Promotions folder if it doesn't arrive within 2 minutes.
              </Text>
            </View>

            {/* Proceed to Reset Password Screen */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                router.push({
                  pathname: '/(auth)/reset-password',
                  params: { email: submittedEmail },
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.btnContent}>
                <Text style={styles.actionBtnText}>Enter Reset Token & Set Password</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Resend Link Button */}
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={() => {
                setIsSubmitted(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.resendBtnText}>Try another email address</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            🔐 Tokens expire after 30 minutes for security
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
    marginBottom: 18,
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
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
  tokenLinkRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
    gap: 6,
  },
  tokenPromptText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tokenLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.emeraldLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  successHeading: {
    fontSize: 19,
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
    marginBottom: 16,
  },
  tipBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resendBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
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
