"use client";

interface ContactMessageFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
}

export function ContactMessageField({
  value,
  onChange,
  placeholder,
  error,
}: ContactMessageFieldProps): React.ReactElement {
  return (
    <div className="group">
      <label htmlFor="message" className="form-label-sm">
        문의사항
        <span className="ml-1 text-red-500">*</span>
        <span className="ml-2 text-xs font-normal text-slate-400">
          50자 이상 필수
        </span>
      </label>
      <textarea
        id="message"
        name="message"
        rows={5}
        maxLength={1000}
        required
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="scrollbar-thin form-input resize-none overflow-y-auto"
        placeholder={placeholder}
      />
      <div className="mt-1 flex justify-between">
        <div>{error && <p className="form-error">{error}</p>}</div>
        <span className="text-xs text-slate-400">{value.length}/1000</span>
      </div>
    </div>
  );
}
