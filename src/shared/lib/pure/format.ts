export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 2)}-${digits.slice(2, digits.length - 4)}-${digits.slice(digits.length - 4)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export function formatPriceWon(won: number | null): string {
  if (won === null || won === undefined) return "현장 견적";
  return `${won.toLocaleString("ko-KR")}원~`;
}

export function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return "—";
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function formatMonthDay(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
}
