/**
 * Chip-style checkbox group for multi-select form fields. Renders a fieldset of
 * checkboxes styled as toggle pills. Each box submits with `name` and its own
 * `value`; the server action reads with `formData.getAll(name)`.
 */
export function ChipGroup<T extends string>({
  name,
  options,
  defaultSelected = [],
  selected,
  onChange,
  multi = true,
}: {
  name: string;
  options: { value: T; label: string }[];
  defaultSelected?: readonly T[];
  selected?: readonly T[];
  onChange?: (next: T[]) => void;
  multi?: boolean;
}) {
  const isControlled = Array.isArray(selected) && typeof onChange === "function";
  const selectedSet = new Set<string>(isControlled ? selected : defaultSelected);

  function toggle(value: T, checked: boolean) {
    if (!isControlled || !onChange) return;
    if (!multi) {
      onChange(checked ? [value] : []);
      return;
    }
    const next = new Set<string>(selectedSet);
    if (checked) next.add(value);
    else next.delete(value);
    const ordered = options
      .map((opt) => opt.value)
      .filter((opt) => next.has(opt));
    onChange(ordered);
  }

  return (
    <fieldset className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const id = `${name}-${opt.value}`;
        return (
          <label
            key={opt.value}
            htmlFor={id}
            className="cursor-pointer select-none rounded-full border border-warmgray-200 bg-white px-3 py-1.5 text-xs font-medium text-warmgray-700 transition has-[input:checked]:border-orange-300 has-[input:checked]:bg-orange-50 has-[input:checked]:text-orange-700 hover:border-warmgray-300"
          >
            <input
              id={id}
              type={multi ? "checkbox" : "radio"}
              name={name}
              value={opt.value}
              {...(isControlled
                ? { checked: selectedSet.has(opt.value) }
                : { defaultChecked: selectedSet.has(opt.value) })}
              onChange={(e) => toggle(opt.value, e.currentTarget.checked)}
              className="peer sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </fieldset>
  );
}
