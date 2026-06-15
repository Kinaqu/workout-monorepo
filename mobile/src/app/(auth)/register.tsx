import { useState } from 'react';
import { View } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { Screen } from '@/components/ui/Screen';
import { clerkErrorMessage } from '@/lib/clerk-errors';
import { OAuthButtons } from '@/features/auth/OAuthButtons';

export default function Register() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSignUp() {
    if (!isLoaded || !signUp || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPending(true);
    } catch (e) {
      setError(clerkErrorMessage(e, 'Could not create the account. Try a different email.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerify() {
    if (!isLoaded || !signUp || !setActive || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/');
        return;
      }
      setError('That code did not verify. Check it and try again.');
    } catch (e) {
      setError(clerkErrorMessage(e, 'Verification failed. Check the code and try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <AppText variant="display">{pending ? 'Verify your email' : 'Create account'}</AppText>
        <AppText variant="secondary">
          {pending ? 'Enter the code we emailed you.' : 'Start your adaptive Kinova plan.'}
        </AppText>

        <Card style={styles.card}>
          {pending ? (
            <>
              <Field
                placeholder="Verification code"
                value={code}
                onChangeText={setCode}
                numeric
                autoComplete="one-time-code"
              />
              {error ? <AppText style={styles.error}>{error}</AppText> : null}
              <Button
                title={submitting ? 'Verifying…' : 'Verify'}
                onPress={onVerify}
                disabled={submitting || !isLoaded}
              />
            </>
          ) : (
            <>
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
                autoComplete="new-password"
              />
              {error ? <AppText style={styles.error}>{error}</AppText> : null}
              <Button
                title={submitting ? 'Creating…' : 'Create account'}
                onPress={onSignUp}
                disabled={submitting || !isLoaded}
              />
            </>
          )}
        </Card>

        {!pending ? (
          <>
            <View style={styles.divider}>
              <AppText variant="muted">or</AppText>
            </View>
            <OAuthButtons />
          </>
        ) : null}

        <View style={styles.footer}>
          <AppText variant="secondary">Already have an account? </AppText>
          <Link href="/login">
            <AppText style={styles.link}>Sign in</AppText>
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
