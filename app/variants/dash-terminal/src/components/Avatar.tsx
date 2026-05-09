type Props = {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-base",
};

export function Avatar({ name, src, size = "md" }: Props) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={
          "rounded-full border border-warmgray-100 object-cover " + SIZE_CLASS[size]
        }
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={
        "inline-flex items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700 " +
        SIZE_CLASS[size]
      }
    >
      {initials || "·"}
    </span>
  );
}
