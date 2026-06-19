"use client";

interface ContactNameFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ContactNameField({
  value,
  onChange,
  error,
}: ContactNameFieldProps): React.ReactElement {
  return (
    <div className="group">
      <label htmlFor="name" className="form-label-sm">
        성함
        <span className="ml-1 text-red-500">*</span>
      </label>
      <input
        id="name"
        name="name"
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="form-input"
        placeholder="이름을 입력하세요"
        data-clarity-mask="True"
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
