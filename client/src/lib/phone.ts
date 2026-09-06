export function formatUaePhoneForFirebase(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00971")) return `+${digits.slice(2)}`;
  if (digits.startsWith("971")) return `+${digits}`;
  if (digits.startsWith("0")) return `+971${digits.slice(1)}`;
  return `+971${digits}`;
}