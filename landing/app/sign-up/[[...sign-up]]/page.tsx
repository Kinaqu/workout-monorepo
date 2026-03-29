import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { ClerkEnvNotice } from "@/components/clerk-env-notice";
import { clerkAppearance, hasClerkCredentials } from "@/lib/clerk";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Start"
      title="Start with a plan built around you."
      description="Create your account, answer a few quick questions, and get workouts that match your level, your goal, and the way you like to train."
      sideTitle="Training that fits real life"
      sideDescription="Home sessions, park workouts, bodyweight progressions, or short blocks of time. Your plan is shaped around what you can actually do."
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
        <ClerkEnvNotice mode="sign up" />
      )}
    </AuthShell>
  );
}
