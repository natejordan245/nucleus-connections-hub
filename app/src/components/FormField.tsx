type FieldProps = {
  id: string;
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
};

export function Field({
  id,
  name,
  label,
  hint,
  required,
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-warmgray-500">
        {label}
        {required && <span className="ml-1 text-orange-500">*</span>}
      </label>
      {hint && <p className="mt-1 text-xs text-warmgray-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40 [&:user-invalid]:border-red-300 [&:user-invalid]:focus:ring-red-200/60 " +
        (props.className ?? "")
      }
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={4}
      {...props}
      className={
        "w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm leading-relaxed text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40 " +
        (props.className ?? "")
      }
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full rounded-lg border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-300/40 [&:user-invalid]:border-red-300 [&:user-invalid]:focus:ring-red-200/60 " +
        (props.className ?? "")
      }
    />
  );
}
