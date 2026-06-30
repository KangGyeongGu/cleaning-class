import { z } from "zod";
import {
  CLEANING_SERVICE_TYPES,
  MOVING_SERVICE_TYPES,
} from "@/shared/lib/pure/constants";

const httpUrl = () =>
  z
    .string()
    .url("올바른 URL 형식이 아닙니다")
    .refine((url) => /^https?:\/\//i.test(url), {
      message: "URL은 http:// 또는 https://로 시작해야 합니다",
    });

const movingServiceTypeEnum = z.enum([...MOVING_SERVICE_TYPES, "기타 문의"] as [
  string,
  ...string[],
]);

const cleaningServiceTypeEnum = z.enum([
  ...CLEANING_SERVICE_TYPES,
  "기타 문의",
] as [string, ...string[]]);

const cleaningContactSchema = z.object({
  inquiryType: z.literal("cleaning"),
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요")
    .regex(/^[0-9-]+$/, "올바른 전화번호 형식이 아닙니다"),
  serviceType: cleaningServiceTypeEnum,
  address: z.string().min(1, "주소를 입력해주세요"),
  addressDetail: z.string().optional().default(""),
  message: z
    .string()
    .min(50, "문의 내용은 최소 50자 이상 작성해주세요")
    .max(1000, "문의 내용은 1000자 이하로 작성해주세요"),
});

const movingContactSchema = z.object({
  inquiryType: z.literal("moving"),
  name: z.string().min(1, "이름을 입력해주세요"),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요")
    .regex(/^[0-9-]+$/, "올바른 전화번호 형식이 아닙니다"),
  serviceType: movingServiceTypeEnum,
  departureAddress: z.string().optional().default(""),
  departureDetail: z.string().optional().default(""),
  destinationAddress: z.string().optional().default(""),
  destinationDetail: z.string().optional().default(""),
  message: z
    .string()
    .min(50, "문의 내용은 최소 50자 이상 작성해주세요")
    .max(1000, "문의 내용은 1000자 이하로 작성해주세요"),
});

export const contactFormSchema = z
  .discriminatedUnion("inquiryType", [
    cleaningContactSchema,
    movingContactSchema,
  ])
  .refine(
    (d) =>
      d.inquiryType !== "moving" ||
      Boolean(d.departureAddress?.trim() || d.destinationAddress?.trim()),
    {
      message: "출발지 또는 도착지 주소 중 최소 1개를 입력해주세요",
      path: ["departureAddress"],
    },
  );

export const loginFormSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
});

export const reviewFormSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력해주세요")
    .max(100, "제목은 100자 이하여야 합니다"),
  summary: z
    .string()
    .min(1, "소개글을 입력해주세요")
    .max(500, "소개글은 500자 이하여야 합니다"),
  tags: z.array(z.string()).min(1, "최소 1개 이상의 태그를 입력해주세요"),
  link_url: httpUrl().or(z.literal("")).optional(),
  is_published: z.boolean(),
});

export const reviewListSortSchema = z
  .enum(["latest", "oldest"])
  .catch("latest");

export type ReviewListSort = z.infer<typeof reviewListSortSchema>;

const PHONE_REGEX =
  /^(02|01[016-9]|0[3-9]\d{1,2})-\d{3,4}-\d{4}$|^0[5-9]0[4-9]-\d{4}-\d{4}$/;

const BUSINESS_NUMBER_REGEX = /^\d{3}-\d{2}-\d{5}$/;

export const siteConfigFormSchema = z.object({
  business_name: z.string().min(1, "업체명을 입력해주세요"),
  representative: z
    .string()
    .max(50, "대표자명은 50자 이하여야 합니다")
    .optional()
    .default(""),
  business_registration_number: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || BUSINESS_NUMBER_REGEX.test(v), {
      message: "올바른 사업자번호 형식이 아닙니다 (예: 000-00-00000)",
    }),
  phone: z
    .string()
    .min(1, "전화번호를 입력해주세요")
    .regex(
      PHONE_REGEX,
      "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678, 02-1234-5678)",
    ),
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  blog_url: httpUrl().or(z.literal("")),
  instagram_url: httpUrl().or(z.literal("")),
  daangn_url: httpUrl().or(z.literal("")),
  site_url: httpUrl(),
  description: z.string().max(500, "설명은 500자 이하여야 합니다").optional(),
  address_region: z.string().optional().default(""),
  address_locality: z.string().optional().default(""),
  address: z.string().max(200, "주소는 200자 이하여야 합니다").optional(),
});

export const movingSiteConfigSchema = z.object({
  moving_representative: z
    .string()
    .max(50, "대표자명은 50자 이하여야 합니다")
    .optional()
    .default(""),
  moving_phone: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || PHONE_REGEX.test(v), {
      message:
        "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678, 02-1234-5678)",
    }),
  moving_business_registration_number: z
    .string()
    .optional()
    .default("")
    .refine((v) => v === "" || BUSINESS_NUMBER_REGEX.test(v), {
      message: "올바른 사업자번호 형식이 아닙니다 (예: 000-00-00000)",
    }),
  moving_address: z
    .string()
    .max(200, "주소는 200자 이하여야 합니다")
    .optional()
    .default(""),
});

export const serviceFormSchema = z.object({
  title: z
    .string()
    .min(1, "서비스명을 입력해주세요")
    .max(50, "서비스명은 50자 이하여야 합니다"),
  description: z
    .string()
    .max(500, "서비스 설명은 500자 이하여야 합니다")
    .optional()
    .default(""),
  category: z.enum(["cleaning", "moving"], {
    errorMap: () => ({ message: "카테고리를 선택해주세요" }),
  }),
  tags: z.array(z.string()).min(1, "최소 1개 이상의 태그를 입력해주세요"),
  sort_order: z
    .number()
    .int("정렬 순서는 정수여야 합니다")
    .min(0, "정렬 순서는 0 이상이어야 합니다"),
  is_published: z.boolean(),
  image_focal_x: z.number().int().min(0).max(100).default(50),
  image_focal_y: z.number().int().min(0).max(100).default(50),
  image_after_focal_x: z.number().int().min(0).max(100).default(50),
  image_after_focal_y: z.number().int().min(0).max(100).default(50),
});

export const faqFormSchema = z.object({
  question: z
    .string()
    .min(1, "질문을 입력해주세요")
    .max(300, "질문은 300자 이하여야 합니다"),
  answer: z
    .string()
    .min(1, "답변을 입력해주세요")
    .max(2000, "답변은 2000자 이하여야 합니다"),
  display_order: z
    .number()
    .int("표시 순서는 정수여야 합니다")
    .min(0, "표시 순서는 0 이상이어야 합니다"),
  is_active: z.boolean(),
});

export const priceItemFormSchema = z.object({
  name: z
    .string()
    .min(1, "항목명을 입력해주세요")
    .max(100, "항목명은 100자 이하여야 합니다"),
  price_won: z
    .number()
    .int("가격은 정수(원 단위)여야 합니다")
    .min(0, "가격은 0 이상이어야 합니다")
    .max(99_999_999, "가격이 너무 큽니다")
    .nullable(),
  sort_order: z
    .number()
    .int("정렬 순서는 정수여야 합니다")
    .min(0, "정렬 순서는 0 이상이어야 합니다")
    .max(9999, "정렬 순서는 9999 이하여야 합니다"),
  is_published: z.boolean(),
});

export const publicReviewFormSchema = z.object({
  rating: z
    .number()
    .min(1, "별점은 최소 1점이어야 합니다")
    .max(5, "별점은 최대 5점이어야 합니다")
    .refine((v) => v % 0.5 === 0, "별점은 0.5 단위여야 합니다"),
  comment: z
    .string()
    .min(1, "리뷰 내용을 입력해주세요")
    .max(500, "리뷰 내용은 500자 이하로 작성해주세요"),
  service_type: z
    .enum([...CLEANING_SERVICE_TYPES] as [string, ...string[]])
    .optional(),
});
