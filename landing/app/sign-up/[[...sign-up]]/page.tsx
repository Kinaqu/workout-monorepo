import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { ClerkEnvNotice } from "@/components/clerk-env-notice";
import {
  clerkAppearance,
  clerkEnvDiagnostics,
  hasClerkCredentials,
} from "@/lib/clerk";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Sign Up"
      title="Create an account without leaving the landing app."
      description="Registration now uses the Clerk flow directly inside the Next.js landing project, with the same appearance carried over from the current frontend."
      sideTitle="New here?"
      sideDescription="After sign-up, users can move into onboarding instead of dropping into a dead-end placeholder page."
    >
      {hasClerkCredentials ? (
        <SignUp
          appearance={clerkAppearance}
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          forceRedirectUrl="/onboarding"
          fallbackRedirectUrl="/onboarding"
        />
      ) : (
        <ClerkEnvNotice
          mode="sign up"
          hasPublishableKey={clerkEnvDiagnostics.hasPublishableKey}
          hasSecretKey={clerkEnvDiagnostics.hasSecretKey}
        />
      )}
    </AuthShell>
  );
}
