"use server";

import { contactFormSchema } from "@/shared/lib/schema/index";
import { sendContactEmail } from "@/shared/lib/infra/mail";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_IMAGE_UPLOAD_SIZE,
  getFileExtensionLower,
  isAllowedImageExtension,
  isAllowedImageMimeType,
} from "@/shared/lib/pure/image-validation";

const MAX_IMAGE_COUNT = 15;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export async function submitContactForm(
  prevState: unknown,
  formData: FormData,
) {
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

  if (filteredImageFiles.length > MAX_IMAGE_COUNT) {
    return {
      success: false,
      error: `이미지는 최대 ${MAX_IMAGE_COUNT}장까지 첨부할 수 있습니다.`,
    };
  }

  for (const file of filteredImageFiles) {
    if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
      return {
        success: false,
        error: `개별 이미지 크기는 10MB를 초과할 수 없습니다. (${file.name})`,
      };
    }
  }

  const totalSize = filteredImageFiles.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return {
      success: false,
      error: "첨부 파일 총 용량은 50MB를 초과할 수 없습니다.",
    };
  }

  for (const file of filteredImageFiles) {
    if (!isAllowedImageMimeType(file.type)) {
      return {
        success: false,
        error: `허용되지 않는 파일 형식입니다: ${file.type}. (${file.name})`,
      };
    }

    const ext = getFileExtensionLower(file.name);
    if (!isAllowedImageExtension(ext)) {
      return {
        success: false,
        error: `허용되지 않는 파일 확장자입니다. 허용 확장자: ${ALLOWED_IMAGE_EXTENSIONS.join(", ")} (${file.name})`,
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
      message: "문의가 성공적으로 접수되었습니다.",
    };
  } catch (error) {
    console.error("Contact email send error:", error);
    return {
      success: false,
      error: "문의 접수에 실패했습니다. 전화로 연락해주세요.",
    };
  }
}
