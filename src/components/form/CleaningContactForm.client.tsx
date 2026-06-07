"use client";

import { useActionState, useState, useEffect, useRef, useMemo } from "react";
import { Check, Loader2 } from "lucide-react";
import { submitContactForm } from "@/shared/actions/contact";
import { track, currentPath } from "@/shared/lib/infra/track";
import { CustomDropdown } from "@/components/form/CustomDropdown.client";
import { ContactImageGallery } from "@/components/form/ContactImageGallery.client";
import { AddressInput } from "@/components/form/AddressInput.client";
import { ContactNameField } from "@/components/form/ContactNameField.client";
import { ContactPhoneField } from "@/components/form/ContactPhoneField.client";
import { ContactMessageField } from "@/components/form/ContactMessageField.client";
import { useContactImageHandler } from "@/shared/lib/hooks/useContactImageHandler";

const PLACEHOLDER =
  "예시) 8평 원룸 주거 청소 문의합니다. 주방 기름때, 유리창, 화장실 환풍구까지 청소가 필요합니다. 빌라 엘리베이터가 없습니다.";

const OTHER_INQUIRY_OPTION = "기타 문의";

interface CleaningContactFormProps {
  serviceOptions: readonly string[];
  initialServiceType?: string;
}

export function CleaningContactForm({
  serviceOptions,
  initialServiceType = "",
}: CleaningContactFormProps): React.ReactElement {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    null,
  );

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState(initialServiceType);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [addressResetKey, setAddressResetKey] = useState(0);
  const [isReset, setIsReset] = useState(false);

  const imageHandler = useContactImageHandler();

  const isSuccess = state?.success === true;
  const showSuccess = isSuccess && !isReset;

  const hasTrackedLead = useRef(false);
  const hasTrackedError = useRef(false);

  const formValid = useMemo(() => {
    return (
      name.trim() !== "" &&
      phone.trim() !== "" &&
      serviceType !== "" &&
      address.trim() !== "" &&
      message.trim().length >= 50
    );
  }, [name, phone, serviceType, address, message]);

  useEffect(() => {
    if (isSuccess && !hasTrackedLead.current) {
      hasTrackedLead.current = true;
      track({
        event_type: "quote_form_success",
        event_payload: {
          inquiry_type: "cleaning",
          service_type: serviceType,
          has_images: imageHandler.images.length > 0,
        },
        path: currentPath(),
      });
    }
    if (!isSuccess) hasTrackedLead.current = false;
  }, [isSuccess, serviceType, imageHandler.images.length]);

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
        event_payload: { inquiry_type: "cleaning", error_kind: errorKind },
        path: currentPath(),
      });
    }
    if (!isFailure) hasTrackedError.current = false;
  }, [isFailure, state]);

  useEffect(() => {
    if (!isSuccess || isReset) return;
    const timer = setTimeout(() => {
      setName("");
      setPhone("");
      setServiceType("");
      setAddress("");
      setMessage("");
      setAddressResetKey((k) => k + 1);
      imageHandler.reset();
      setIsReset(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, isReset, imageHandler]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="inquiryType" value="cleaning" />

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ContactNameField
            value={name}
            onChange={(v) => {
              setName(v);
              if (isReset) setIsReset(false);
            }}
            error={state?.errors?.name?.[0]}
          />
          <ContactPhoneField
            value={phone}
            onChange={(v) => {
              setPhone(v);
              if (isReset) setIsReset(false);
            }}
            error={state?.errors?.phone?.[0]}
          />
        </div>

        <CustomDropdown
          label="서비스 종류"
          name="serviceType"
          options={[...serviceOptions, OTHER_INQUIRY_OPTION]}
          placeholder="서비스를 선택해주세요"
          required
          error={state?.errors?.serviceType?.[0]}
          value={serviceType}
          onChange={(value) => {
            setServiceType(value);
            if (isReset) setIsReset(false);
          }}
        />

        <AddressInput
          key={`cleaning-${addressResetKey}`}
          label="주소"
          required
          addressName="address"
          detailName="addressDetail"
          error={state?.errors?.address?.[0]}
          onChange={(addr) => {
            setAddress(addr);
            if (isReset) setIsReset(false);
          }}
        />

        <ContactMessageField
          value={message}
          onChange={(v) => {
            setMessage(v);
            if (isReset) setIsReset(false);
          }}
          placeholder={PLACEHOLDER}
          error={state?.errors?.message?.[0]}
        />

        <ContactImageGallery
          fileInputRef={imageHandler.fileInputRef}
          images={imageHandler.images}
          previewUrls={imageHandler.previewUrls}
          onAdd={imageHandler.handleChange}
          onRemoveAt={imageHandler.handleRemove}
        />
      </div>

      <div className="pt-4 text-center">
        <button
          type="submit"
          disabled={isPending || imageHandler.isConverting || !formValid}
          className="btn-primary px-10 py-3"
          onClick={() => {
            track({
              event_type: "quote_form_click",
              event_payload: {
                inquiry_type: "cleaning",
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
          ) : imageHandler.isConverting ? (
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
  );
}
