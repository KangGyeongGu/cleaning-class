"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CustomDropdown } from "@/components/form/CustomDropdown.client";
import { ContactImageGallery } from "@/components/form/ContactImageGallery.client";
import { AddressInput } from "@/components/form/AddressInput.client";
import { ContactNameField } from "@/components/form/ContactNameField.client";
import { ContactPhoneField } from "@/components/form/ContactPhoneField.client";
import { ContactMessageField } from "@/components/form/ContactMessageField.client";
import { useContactImageHandler } from "@/shared/lib/hooks/useContactImageHandler";
import { useContactForm } from "@/shared/lib/hooks/useContactForm";

type InquiryType = "cleaning" | "moving";

const PLACEHOLDER: Record<InquiryType, string> = {
  cleaning:
    "예시) 8평 원룸 주거 청소 문의합니다. 주방 기름때, 유리창, 화장실 환풍구까지 청소가 필요합니다. 빌라 엘리베이터가 없습니다.",
  moving:
    "예시) 8평 원룸에서 24평 아파트로 이사입니다. 장롱·냉장고·세탁기·침대 포함. 출발지 엘리베이터 없음.",
};

interface ContactFormProps {
  inquiryType: InquiryType;
  serviceOptions: readonly string[];
  initialServiceType?: string;
}

export function ContactForm({
  inquiryType,
  serviceOptions,
  initialServiceType = "",
}: ContactFormProps): React.ReactElement {
  const [address, setAddress] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");

  const imageHandler = useContactImageHandler();

  const addressValid =
    inquiryType === "cleaning"
      ? address.trim() !== ""
      : departure.trim() !== "" || destination.trim() !== "";

  const {
    state,
    formAction,
    isPending,
    name,
    setName,
    phone,
    setPhone,
    serviceType,
    setServiceType,
    message,
    setMessage,
    addressResetKey,
    formValid,
    showSuccess,
    clearReset,
    trackClick,
  } = useContactForm({
    inquiryType,
    initialServiceType,
    hasImages: imageHandler.images.length > 0,
    addressValid,
    onReset: () => {
      imageHandler.reset();
      setAddress("");
      setDeparture("");
      setDestination("");
    },
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="inquiryType" value={inquiryType} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
      />

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ContactNameField
            value={name}
            onChange={(v) => {
              setName(v);
              clearReset();
            }}
            error={state?.errors?.name?.[0]}
          />
          <ContactPhoneField
            value={phone}
            onChange={(v) => {
              setPhone(v);
              clearReset();
            }}
            error={state?.errors?.phone?.[0]}
          />
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
            clearReset();
          }}
        />

        {inquiryType === "cleaning" ? (
          <AddressInput
            key={`cleaning-${addressResetKey}`}
            label="주소"
            required
            addressName="address"
            detailName="addressDetail"
            error={state?.errors?.address?.[0]}
            onChange={(addr) => {
              setAddress(addr);
              clearReset();
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5">
            <AddressInput
              key={`moving-from-${addressResetKey}`}
              label="출발지"
              addressName="departureAddress"
              detailName="departureDetail"
              error={state?.errors?.departureAddress?.[0]}
              onChange={(addr) => {
                setDeparture(addr);
                clearReset();
              }}
            />
            <AddressInput
              key={`moving-to-${addressResetKey}`}
              label="도착지"
              addressName="destinationAddress"
              detailName="destinationDetail"
              onChange={(addr) => {
                setDestination(addr);
                clearReset();
              }}
            />
          </div>
        )}

        <ContactMessageField
          value={message}
          onChange={(v) => {
            setMessage(v);
            clearReset();
          }}
          placeholder={PLACEHOLDER[inquiryType]}
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
        <Button
          type="submit"
          variant="primary"
          size="none"
          className="px-10 py-3"
          loading={isPending}
          disabled={isPending || imageHandler.isConverting || !formValid}
          onClick={trackClick}
        >
          {isPending ? (
            "문의 중..."
          ) : imageHandler.isConverting ? (
            <>
              <Spinner /> 이미지 변환 중...
            </>
          ) : showSuccess ? (
            <>
              <Check className="h-4 w-4" /> 전송 완료
            </>
          ) : (
            "문의하기"
          )}
        </Button>
        {showSuccess && state?.message && (
          <p className="form-success mt-4">{state.message}</p>
        )}
        {state?.error && <p className="form-error mt-4">{state.error}</p>}
      </div>
    </form>
  );
}
