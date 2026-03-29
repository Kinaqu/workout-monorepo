import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { ClerkEnvNotice } from "@/components/clerk-env-notice";
import {
  clerkAppearance,
  clerkEnvDiagnostics,
  hasClerkCredentials,
} from "@/lib/clerk";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Sign In"
      title="Return to the workout flow with the same look and feel."
      description="The landing auth experience now lives inside Next.js and mirrors the same dark Clerk treatment that already exists in the frontend app."
      sideTitle="Existing account?"
      sideDescription="Sign in here and continue straight into the app shell. New users can switch to sign-up without leaving the landing experience."
    >
      {hasClerkCredentials ? (
        <SignIn
          appearance={clerkAppearance}
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          forceRedirectUrl="/app"
          fallbackRedirectUrl="/app"
        />
      ) : (
        <ClerkEnvNotice
          mode="sign in"
          hasPublishableKey={clerkEnvDiagnostics.hasPublishableKey}
          hasSecretKey={clerkEnvDiagnostics.hasSecretKey}
        />
      )}
    </AuthShell>
  );
}
