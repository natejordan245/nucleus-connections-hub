export function decodeOnboardError(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw === "missing_required") return null;
  if (raw === "missing_account") {
    return "Name, email, and password are all required to create your account.";
  }
  return decodeURIComponent(raw);
}
