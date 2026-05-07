/**
 * LoginScreen — Student authentication
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, Animated, Easing,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Animated values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('learnavo123');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Background decorations */}
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.appName}>LearnAvo</Text>
          <Text style={styles.tagline}>INTELLIGENT ATTENDANCE INTEGRITY</Text>
        </View>

        {/* Login card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Login</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@student.edu"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo accounts */}
        <View style={styles.demoCard}>
          <Text style={styles.demoLabel}>QUICK DEMO LOGIN</Text>
          {[
            { label: 'Arjun Patel', email: 'arjun@student.edu', icon: '🎓' },
            { label: 'Meera Reddy', email: 'meera@student.edu', icon: '🎓' },
          ].map((demo) => (
            <TouchableOpacity
              key={demo.email}
              style={styles.demoBtn}
              onPress={() => demoLogin(demo.email)}
              activeOpacity={0.7}
            >
              <Text style={styles.demoIcon}>{demo.icon}</Text>
              <Text style={styles.demoName}>{demo.label}</Text>
              <Text style={styles.demoEmail}>{demo.email}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Attendance you can prove. Integrity you can measure.
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  bgDecor1: {
    position: 'absolute', top: '8%', left: '10%',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(16,185,129,0.04)',
  },
  bgDecor2: {
    position: 'absolute', bottom: '10%', right: '5%',
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(59,130,246,0.03)',
  },
  content: { zIndex: 1 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.emerald500,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: { fontSize: 30, fontWeight: '800', color: Colors.white },
  appName: {
    fontSize: FontSizes.xxxl, fontWeight: '800',
    color: Colors.textPrimary, letterSpacing: -1.5,
  },
  tagline: {
    fontSize: FontSizes.xs, fontWeight: '600',
    color: Colors.emerald400, letterSpacing: 2, marginTop: 4,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.lg, padding: Spacing.xxl,
  },
  cardTitle: {
    fontSize: FontSizes.xl, fontWeight: '700',
    color: Colors.textPrimary, marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: 24,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg, borderRadius: BorderRadius.sm,
    padding: Spacing.md, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: { color: Colors.danger, fontSize: FontSizes.sm },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: FontSizes.xs, fontWeight: '700',
    color: Colors.textSecondary, letterSpacing: 1,
    marginBottom: 6, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.md, padding: 14,
    fontSize: FontSizes.md, color: Colors.textPrimary,
  },
  loginBtn: {
    backgroundColor: Colors.emerald500,
    borderRadius: BorderRadius.md, padding: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    color: Colors.white, fontSize: FontSizes.lg,
    fontWeight: '700', letterSpacing: 0.3,
  },
  demoCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.lg, padding: Spacing.xl,
    marginTop: 14,
  },
  demoLabel: {
    fontSize: FontSizes.xs, fontWeight: '700',
    color: Colors.textMuted, letterSpacing: 1.5,
    marginBottom: 12,
  },
  demoBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.sm, padding: 12,
    marginBottom: 8,
  },
  demoIcon: { fontSize: 18, marginRight: 10 },
  demoName: {
    flex: 1, fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textPrimary,
  },
  demoEmail: { fontSize: FontSizes.xs, color: Colors.textMuted },
  footer: {
    textAlign: 'center', marginTop: 24,
    fontSize: FontSizes.xs, color: Colors.textMuted,
  },
});
