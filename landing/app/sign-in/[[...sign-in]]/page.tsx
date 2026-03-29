import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { ClerkEnvNotice } from "@/components/clerk-env-notice";
import { clerkAppearance, hasClerkCredentials } from "@/lib/clerk";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Pick up your progress where you left off."
      description="Sign in to return to your plan, track your next workouts, and keep building toward your goal one step at a time."
      sideTitle="A plan that stays with you"
      sideDescription="Your training path is meant to keep adjusting as your fitness improves, your schedule changes, and your goals get closer."
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
        <ClerkEnvNotice mode="sign in" />
      )}
    </AuthShell>
  );
}
