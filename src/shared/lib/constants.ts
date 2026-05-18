export const CLEANING_SERVICE_TYPES = [
  "거주청소",
  "정기청소",
  "특수청소",
  "쓰레기집청소",
  "상가청소",
] as const;

export const MOVING_SERVICE_TYPES = [
  "원룸이사",
  "일반이사",
  "반포장이사",
  "포장이사",
  "부분이사",
] as const;

export const SERVICE_TYPES = [
  ...CLEANING_SERVICE_TYPES,
  ...MOVING_SERVICE_TYPES,
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const CLEANING_INQUIRY_OPTIONS: string[] = [
  ...CLEANING_SERVICE_TYPES,
  "기타 문의",
];

export const MOVING_INQUIRY_OPTIONS: string[] = [
  ...MOVING_SERVICE_TYPES,
  "기타 문의",
];
