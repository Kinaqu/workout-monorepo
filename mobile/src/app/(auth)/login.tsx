import { useState } from 'react';
import { View } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Link, router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Screen } from '@/components/ui/Screen';
import { clerkErrorMessage } from '@/lib/clerk-errors';
import { OAuthButtons } from '@/features/auth/OAuthButtons';

export default function Login() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (!isLoaded || !signIn || !setActive || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/');
        return;
      }
      setError('Extra verification is required. Finish signing in on the web app for now.');
    } catch (e) {
      setError(clerkErrorMessage(e, 'Sign-in failed. Check your details and try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <AppText variant="display">Welcome back</AppText>
        <AppText variant="secondary">Sign in to your Kinova training route.</AppText>

        <Card style={styles.card}>
          <Field
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
          <Field
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />
          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          <Button
            title={submitting ? 'Signing in…' : 'Sign in'}
            onPress={onSubmit}
            disabled={submitting || !isLoaded}
          />
        </Card>

        <View style={styles.divider}>
          <AppText variant="muted">or</AppText>
        </View>
        <OAuthButtons />

        <View style={styles.footer}>
          <AppText variant="secondary">New here? </AppText>
          <Link href="/register">
            <AppText style={styles.link}>Create an account</AppText>
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.space.xl,
    gap: theme.space.md,
  },
  card: {
    gap: theme.space.md,
  },
  error: {
    color: theme.colors.error,
  },
  divider: {
    alignItems: 'center',
    marginVertical: theme.space.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    color: theme.colors.accentSoft,
    fontFamily: theme.fonts.bodySemiBold,
  },
}));
