import { useState } from 'react';
import { View } from 'react-native';
import { useSSO } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { clerkErrorMessage } from '@/lib/clerk-errors';

// Finalizes the web-browser auth session if the app was reopened via redirect.
WebBrowser.maybeCompleteAuthSession();

type OAuthStrategy = 'oauth_google' | 'oauth_apple';

// Social sign-in via Clerk's SSO web flow (no native module needed — uses
// expo-web-browser). On success Clerk returns a session; setActive then the
// lifecycle gate at "/" routes the user onward.
export function OAuthButtons() {
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState<OAuthStrategy | null>(null);
  const [error, setError] = useState('');

  async function onPress(strategy: OAuthStrategy) {
    if (busy) return;
    setBusy(strategy);
    setError('');
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
        return;
      }
      // No session id → the flow was cancelled or needs extra steps.
      setError('Could not finish social sign-in. Please try again.');
    } catch (e) {
      setError(clerkErrorMessage(e, 'Social sign-in failed. Please try again.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.wrap}>
      <Button
        title={busy === 'oauth_google' ? 'Opening Google…' : 'Continue with Google'}
        tone="secondary"
        onPress={() => onPress('oauth_google')}
        disabled={busy !== null}
      />
      <Button
        title={busy === 'oauth_apple' ? 'Opening Apple…' : 'Continue with Apple'}
        tone="secondary"
        onPress={() => onPress('oauth_apple')}
        disabled={busy !== null}
      />
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  wrap: {
    gap: theme.space.sm,
  },
  error: {
    color: theme.colors.error,
  },
}));
