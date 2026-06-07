export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export function formatPriceWon(won: number | null): string {
  if (won === null || won === undefined) return "현장 견적";
  return `${won.toLocaleString("ko-KR")}원~`;
}
