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

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const DEFAULT_FOCAL_POINT = 50;
export const SUPABASE_NOT_FOUND_CODE = "PGRST116";

export const CLEANING_REGIONS: readonly string[] = [
  "전주시 완산구",
  "전주시 덕진구",
  "군산시",
  "익산시",
  "정읍시",
  "남원시",
  "김제시",
  "완주군",
  "진안군",
  "무주군",
  "장수군",
  "임실군",
  "순창군",
  "고창군",
  "부안군",
] as const;
