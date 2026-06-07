"use client";

import { formatPhoneNumber } from "@/shared/lib/pure/format";

interface ContactPhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ContactPhoneField({
  value,
  onChange,
  error,
}: ContactPhoneFieldProps): React.ReactElement {
  return (
    <div className="group">
      <label htmlFor="phone" className="form-label-sm">
        연락처
        <span className="ml-1 text-red-500">*</span>
      </label>
      <input
        id="phone"
        name="phone"
        type="tel"
        required
        value={value}
        onChange={(e) => onChange(formatPhoneNumber(e.currentTarget.value))}
        className="form-input"
        placeholder="000-0000-0000"
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
