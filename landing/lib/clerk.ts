export const hasClerkPublishableKey = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

export const hasClerkSecretKey = Boolean(process.env.CLERK_SECRET_KEY);

export const hasClerkCredentials =
  hasClerkPublishableKey && hasClerkSecretKey;

export const clerkEnvDiagnostics = {
  hasPublishableKey: hasClerkPublishableKey,
  hasSecretKey: hasClerkSecretKey,
};

export const clerkAppearance = {
  options: {
    showOptionalFields: false,
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
    unsafe_disableDevelopmentModeWarnings: true,
    shimmer: false,
    animations: true,
    logoPlacement: "none",
  },
  variables: {
    colorPrimary: "#bb86fc",
    colorBackground: "#1a1a1a",
    colorInputBackground: "#111116",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#a8a8b8",
    colorDanger: "#cf6679",
    borderRadius: "14px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  elements: {
    rootBox: "clerk-root",
    card: "clerk-card",
    headerTitle: "clerk-title",
    headerSubtitle: "clerk-subtitle",
    alternativeMethodsBlockButton: "clerk-alt-method-button",
    alternativeMethodsBlockButtonText: "clerk-alt-method-button-text",
    alternativeMethodsBlockButtonArrow: "clerk-alt-method-button-arrow",
    socialButtonsBlockButton: "clerk-social-button",
    socialButtonsBlockButtonText: "clerk-social-button-text",
    dividerLine: "clerk-divider-line",
    dividerText: "clerk-divider-text",
    formFieldLabel: "clerk-label",
    formFieldInput: "clerk-input",
    formFieldInputShowPasswordButton: "clerk-password-toggle",
    formButtonPrimary: "clerk-primary-button",
    footerActionText: "clerk-footer-text",
    footerActionLink: "clerk-footer-link",
    identityPreviewText: "clerk-text-secondary",
    formResendCodeLink: "clerk-footer-link",
    badge: "clerk-badge",
  },
};
