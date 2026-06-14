// Clerk surfaces validation/auth failures as `error.errors[]`. Pull out the
// most useful message for display.
export function clerkErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error && typeof error === 'object' && 'errors' in error) {
    const list = (error as { errors?: { message?: string; longMessage?: string }[] }).errors;
    const first = list?.[0];
    if (first) return first.longMessage || first.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
