"use server";

import { headers } from "next/headers";
import { contactFormSchema } from "@/shared/lib/schema/index";
import { sendContactEmail } from "@/shared/lib/infra/mail";
import {
  CONTACT_MAX_IMAGE_COUNT,
  validateContactImageFile,
  isValidImageMagicBytes,
} from "@/shared/lib/pure/image-validation";
import { checkRateLimit } from "@/shared/lib/server/rate-limit";

const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW_MS = 60_000;
const SUCCESS_MESSAGE = "문의가 성공적으로 접수되었습니다.";

export async function submitContactForm(
  prevState: unknown,
  formData: FormData,
) {
  if (formData.get("website")) {
    return { success: true, message: SUCCESS_MESSAGE };
  }

  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (
    !checkRateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS)
  ) {
    return {
      success: false,
      error: "잠시 후 다시 시도해주세요.",
    };
  }

  const rawData = {
    inquiryType: formData.get("inquiryType") ?? "cleaning",
    name: formData.get("name"),
    phone: formData.get("phone"),
    serviceType: formData.get("serviceType"),
    address: formData.get("address"),
    addressDetail: formData.get("addressDetail"),
    departureAddress: formData.get("departureAddress"),
    departureDetail: formData.get("departureDetail"),
    destinationAddress: formData.get("destinationAddress"),
    destinationDetail: formData.get("destinationDetail"),
    message: formData.get("message"),
  };

  const validationResult = contactFormSchema.safeParse(rawData);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const imageFiles = formData.getAll("images") as File[];
  const filteredImageFiles = imageFiles.filter((file) => file && file.size > 0);

  if (filteredImageFiles.length > CONTACT_MAX_IMAGE_COUNT) {
    return {
      success: false,
      error: `이미지는 최대 ${CONTACT_MAX_IMAGE_COUNT}장까지 첨부할 수 있습니다.`,
    };
  }

  for (const file of filteredImageFiles) {
    const { ok, message } = validateContactImageFile(file);
    if (!ok) {
      return { success: false, error: message };
    }
    const header = new Uint8Array(await file.arrayBuffer());
    if (!isValidImageMagicBytes(header.subarray(0, 12))) {
      return {
        success: false,
        error: `유효하지 않은 이미지 파일입니다. (${file.name})`,
      };
    }
  }

  try {
    const imageAttachments = await Promise.all(
      filteredImageFiles.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const sanitized = file.name
          .replace(/[/\\:*?"<>|\r\n]/g, "")
          .replace(/[^a-zA-Z0-9._-]/g, "_");
        return { filename: sanitized, content: Buffer.from(bytes) };
      }),
    );

    const data = validationResult.data;

    function joinAddress(main: string, detail?: string): string {
      const d = detail?.trim();
      return d ? `${main} ${d}` : main;
    }

    await sendContactEmail({
      inquiryType: data.inquiryType,
      name: data.name,
      phone: data.phone,
      serviceType: data.serviceType,
      address:
        data.inquiryType === "cleaning"
          ? joinAddress(data.address, data.addressDetail)
          : undefined,
      departureAddress:
        data.inquiryType === "moving"
          ? joinAddress(data.departureAddress, data.departureDetail)
          : undefined,
      destinationAddress:
        data.inquiryType === "moving"
          ? joinAddress(data.destinationAddress, data.destinationDetail)
          : undefined,
      message: data.message,
      images: imageAttachments.length > 0 ? imageAttachments : undefined,
    });

    return {
      success: true,
      message: SUCCESS_MESSAGE,
    };
  } catch (error) {
    console.error("Contact email send error:", error);
    return {
      success: false,
      error: "문의 접수에 실패했습니다. 전화로 연락해주세요.",
    };
  }
}
