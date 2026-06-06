"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { submitContactForm } from "@/shared/actions/contact";
import { track, currentPath } from "@/shared/lib/infra/track";
import { formatPhoneNumber } from "@/shared/lib/pure/format";
import {
  CLEANING_INQUIRY_OPTIONS,
  MOVING_INQUIRY_OPTIONS,
} from "@/shared/lib/pure/constants";
import {
  CONTACT_MAX_IMAGE_COUNT,
  getFileExtensionLower,
  validateContactImageFile,
} from "@/shared/lib/pure/image-validation";
import { CustomDropdown } from "@/components/form/CustomDropdown.client";
import { ContactImageGallery } from "@/components/form/ContactImageGallery.client";
import { AddressInput } from "@/components/form/AddressInput.client";
import { useInViewport } from "@/shared/lib/hooks/useInViewport";
import { useImageUpload } from "@/shared/lib/hooks/useImageUpload";

type InquiryType = "cleaning" | "moving";

interface ContactFormProps {
  phone?: string;
}

export function ContactForm({ phone }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    null,
  );

  const [inquiryType, setInquiryType] = useState<InquiryType>("cleaning");

  const {
    images,
    previewUrls,
    addFiles,
    removeAt,
    clear: clearImages,
  } = useImageUpload(CONTACT_MAX_IMAGE_COUNT);
  const [isConverting, setIsConverting] = useState(false);
  const [messageLength, setMessageLength] = useState<number>(0);
  const [formValid, setFormValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [serviceType, setServiceType] = useState("");
  const [cleaningAddress, setCleaningAddress] = useState("");
  const [movingDeparture, setMovingDeparture] = useState("");
  const [movingDestination, setMovingDestination] = useState("");
  const [addressResetKey, setAddressResetKey] = useState(0);
  const [isReset, setIsReset] = useState(false);
  const { ref: sectionRef, isVisible } = useInViewport();

  const isSuccess = state?.success === true;
  const showSuccess = isSuccess && !isReset;

  const hasTrackedLead = useRef(false);
  const hasTrackedError = useRef(false);

  useEffect(() => {
    if (isSuccess && !hasTrackedLead.current) {
      hasTrackedLead.current = true;
      track({
        event_type: "quote_form_success",
        event_payload: {
          inquiry_type: inquiryType,
          service_type: serviceType,
          has_images: images.length > 0,
        },
        path: currentPath(),
      });
    }
    if (!isSuccess) {
      hasTrackedLead.current = false;
    }
  }, [isSuccess, serviceType, inquiryType, images.length]);

  const isFailure = state?.success === false;
  useEffect(() => {
    if (isFailure && !hasTrackedError.current) {
      hasTrackedError.current = true;
      const errorKind = state?.errors
        ? "validation"
        : state?.error?.includes("이미지")
          ? "upload_fail"
          : state?.error?.includes("이메일") ||
              state?.error?.includes("발송") ||
              state?.error?.includes("SMTP")
            ? "mail_fail"
            : "unknown";
      track({
        event_type: "quote_form_error",
        event_payload: { inquiry_type: inquiryType, error_kind: errorKind },
        path: currentPath(),
      });
    }
    if (!isFailure) {
      hasTrackedError.current = false;
    }
  }, [isFailure, inquiryType, state]);

  useEffect(() => {
    if (!isSuccess || isReset) return;

    const timer = setTimeout(() => {
      clearImages();
      setMessageLength(0);
      setFormValid(false);
      setServiceType("");
      setCleaningAddress("");
      setMovingDeparture("");
      setMovingDestination("");
      setAddressResetKey((k) => k + 1);
      setIsReset(true);

      if (nameRef.current) nameRef.current.value = "";
      if (phoneRef.current) phoneRef.current.value = "";
      if (messageRef.current) messageRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSuccess, isReset, clearImages]);

  const checkFormValidity = () => {
    const name = nameRef.current?.value.trim() ?? "";
    const phoneValue = phoneRef.current?.value.trim() ?? "";
    const message = messageRef.current?.value.trim() ?? "";

    if (isReset) setIsReset(false);

    const baseValid =
      name !== "" &&
      phoneValue !== "" &&
      serviceType !== "" &&
      message.length >= 50;

    if (inquiryType === "cleaning") {
      setFormValid(baseValid && cleaningAddress.trim() !== "");
    } else {
      const eitherAddress =
        movingDeparture.trim() !== "" || movingDestination.trim() !== "";
      setFormValid(baseValid && eitherAddress);
    }
  };

  const handleInquiryTypeChange = (type: InquiryType) => {
    setInquiryType(type);
    setServiceType("");
    setCleaningAddress("");
    setMovingDeparture("");
    setMovingDestination("");
    setAddressResetKey((k) => k + 1);

    setTimeout(() => {
      const name = nameRef.current?.value.trim() ?? "";
      const phoneValue = phoneRef.current?.value.trim() ?? "";
      const message = messageRef.current?.value.trim() ?? "";
      const baseValid =
        name !== "" && phoneValue !== "" && message.length >= 50;
      setFormValid(baseValid && false);
    }, 0);
  };

  function syncFileInputDataTransfer(files: File[]): void {
    if (!fileInputRef.current) return;
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    fileInputRef.current.files = dt.files;
  }

  function isHeicFile(file: File): boolean {
    const type = file.type.toLowerCase();
    if (
      type === "image/heic" ||
      type === "image/heif" ||
      type === "image/heic-sequence" ||
      type === "image/heif-sequence"
    ) {
      return true;
    }
    const ext = getFileExtensionLower(file.name);
    return ext === "heic" || ext === "heif";
  }

  async function convertHeicToJpeg(file: File): Promise<File> {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.85,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    return new File([blob], newName, { type: "image/jpeg" });
  }

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    if (isConverting) return;
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length === 0) return;

    if (images.length + incoming.length > CONTACT_MAX_IMAGE_COUNT) {
      alert(`이미지는 최대 ${CONTACT_MAX_IMAGE_COUNT}장까지 첨부 가능합니다.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const hasHeic = incoming.some(isHeicFile);
    if (hasHeic) setIsConverting(true);

    try {
      const processed: File[] = [];
      for (const file of incoming) {
        try {
          const next = isHeicFile(file) ? await convertHeicToJpeg(file) : file;
          const result = validateContactImageFile(next);
          if (!result.ok) {
            alert(result.message);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }
          processed.push(next);
        } catch {
          alert(`이미지 변환에 실패했습니다. (${file.name})`);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      addFiles(processed);
      syncFileInputDataTransfer([...images, ...processed]);
    } finally {
      setIsConverting(false);
    }
  };

  const handleImageRemove = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    removeAt(index);
    syncFileInputDataTransfer(next);
  };

  const serviceOptions =
    inquiryType === "cleaning"
      ? CLEANING_INQUIRY_OPTIONS
      : MOVING_INQUIRY_OPTIONS;

  return (
    <section ref={sectionRef} id="contact" className="bg-white">
      <div className="container mx-auto max-w-lg px-4 md:px-8 lg:px-12">
        <div
          className={`mb-8 text-center transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h2 className="text-heading-1 mb-3">CONTACT</h2>
          {phone && (
            <p className="mt-3 text-sm text-slate-600">
              유선상담{" "}
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center px-1 font-bold text-slate-900 hover:underline"
                onClick={() =>
                  track({
                    event_type: "phone_click",
                    event_payload: {
                      phone_type: "cleaning",
                      click_location: "contact_form",
                    },
                    path: currentPath(),
                  })
                }
              >
                {phone}
              </a>
            </p>
          )}
        </div>

        <form
          action={formAction}
          className={`space-y-6 transition-all delay-200 duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => handleInquiryTypeChange("cleaning")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                inquiryType === "cleaning"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              청소의뢰
            </button>
            <button
              type="button"
              onClick={() => handleInquiryTypeChange("moving")}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                inquiryType === "moving"
                  ? "border-b-2 border-slate-900 text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              이사의뢰
            </button>
          </div>

          <input type="hidden" name="inquiryType" value={inquiryType} />

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="group">
                <label htmlFor="name" className="form-label-sm">
                  성함
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="form-input"
                  placeholder="이름을 입력하세요"
                  onInput={checkFormValidity}
                />
                {state?.errors?.name && (
                  <p className="form-error">{state.errors.name[0]}</p>
                )}
              </div>
              <div className="group">
                <label htmlFor="phone" className="form-label-sm">
                  연락처
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  ref={phoneRef}
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  onInput={(e) => {
                    const input = e.currentTarget;
                    input.value = formatPhoneNumber(input.value);
                    checkFormValidity();
                  }}
                  className="form-input"
                  placeholder="000-0000-0000"
                />
                {state?.errors?.phone && (
                  <p className="form-error">{state.errors.phone[0]}</p>
                )}
              </div>
            </div>

            <CustomDropdown
              label="서비스 종류"
              name="serviceType"
              options={serviceOptions}
              placeholder="서비스를 선택해주세요"
              required
              error={state?.errors?.serviceType?.[0]}
              value={serviceType}
              onChange={(value) => {
                setServiceType(value);
                setTimeout(checkFormValidity, 0);
              }}
            />

            {inquiryType === "cleaning" && (
              <AddressInput
                key={`cleaning-${addressResetKey}`}
                label="주소"
                required
                addressName="address"
                detailName="addressDetail"
                error={state?.errors?.address?.[0]}
                onChange={(addr) => {
                  setCleaningAddress(addr);
                  setTimeout(checkFormValidity, 0);
                }}
              />
            )}

            {inquiryType === "moving" && (
              <div className="grid grid-cols-1 gap-5">
                <AddressInput
                  key={`moving-from-${addressResetKey}`}
                  label="출발지"
                  addressName="departureAddress"
                  detailName="departureDetail"
                  error={state?.errors?.departureAddress?.[0]}
                  onChange={(addr) => {
                    setMovingDeparture(addr);
                    setTimeout(checkFormValidity, 0);
                  }}
                />
                <AddressInput
                  key={`moving-to-${addressResetKey}`}
                  label="도착지"
                  addressName="destinationAddress"
                  detailName="destinationDetail"
                  error={state?.errors?.destinationAddress?.[0]}
                  onChange={(addr) => {
                    setMovingDestination(addr);
                    setTimeout(checkFormValidity, 0);
                  }}
                />
              </div>
            )}

            <div className="group">
              <label htmlFor="message" className="form-label-sm">
                문의사항
                <span className="ml-1 text-red-500">*</span>
                <span className="ml-2 text-xs font-normal text-slate-400">
                  50자 이상 필수
                </span>
              </label>
              <textarea
                ref={messageRef}
                id="message"
                name="message"
                rows={5}
                maxLength={1000}
                required
                className="scrollbar-thin form-input resize-none overflow-y-auto"
                placeholder={
                  inquiryType === "moving"
                    ? `예시) 8평 원룸에서 24평 아파트로 이사입니다. 장롱·냉장고·세탁기·침대 포함. 출발지 엘리베이터 없음.`
                    : `예시) 8평 원룸 주거 청소 문의합니다. 주방 기름때, 유리창, 화장실 환풍구까지 청소가 필요합니다. 빌라 엘리베이터가 없습니다.`
                }
                onInput={(e) => {
                  setMessageLength(e.currentTarget.value.length);
                  checkFormValidity();
                }}
              ></textarea>
              <div className="mt-1 flex justify-between">
                <div>
                  {state?.errors?.message && (
                    <p className="form-error">{state.errors.message[0]}</p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {messageLength}/1000
                </span>
              </div>

              <ContactImageGallery
                fileInputRef={fileInputRef}
                images={images}
                previewUrls={previewUrls}
                onAdd={handleImageChange}
                onRemoveAt={handleImageRemove}
              />
            </div>
          </div>

          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={isPending || isConverting || !formValid}
              className="btn-primary px-10 py-3"
              onClick={() => {
                track({
                  event_type: "quote_form_click",
                  event_payload: {
                    inquiry_type: inquiryType,
                    service_type: serviceType,
                  },
                  path: currentPath(),
                });
              }}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> 문의 중...
                </span>
              ) : isConverting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> 이미지 변환 중...
                </span>
              ) : showSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" /> 전송 완료
                </span>
              ) : (
                "문의하기"
              )}
            </button>
            {showSuccess && state?.message && (
              <p className="form-success mt-4">{state.message}</p>
            )}
            {state?.error && <p className="form-error mt-4">{state.error}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
