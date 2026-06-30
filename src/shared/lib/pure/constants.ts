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

export const MOVING_INQUIRY_OPTIONS: string[] = [
  ...MOVING_SERVICE_TYPES,
  "기타 문의",
];

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const DEFAULT_FOCAL_POINT = 50;
export const SUPABASE_NOT_FOUND_CODE = "PGRST116";

export const BLUR_PLACEHOLDER: string =
  "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoIAAUAAkA4JZQCdAEO/hepgAAA/vxLOv98KRk4BgLv/5P/AOiV/wPYpn+N1Vf/UYx1Z//0YSz6Le/+igAAAA==";

export const HOME_META_DESCRIPTION =
  "청소클라쓰는 거주·입주·정기·상가·특수 청소부터 원룸·포장·반포장 이사까지 전문 맞춤 서비스를 제공하는 전주 1등 청소·이사업체입니다.";
