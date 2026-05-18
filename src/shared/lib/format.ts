export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

export function buildDescription(): string {
  return "청소클라쓰는 거주·입주·정기·상가·특수 청소부터 원룸·포장·반포장 이사까지 전문 맞춤 서비스를 제공하는 전주 1등 청소·이사업체입니다.";
}

export function formatPriceWon(won: number | null): string {
  if (won === null || won === undefined) return "현장 견적";
  return `${won.toLocaleString("ko-KR")}원~`;
}
