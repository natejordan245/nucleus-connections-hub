import type { ComponentPropsWithoutRef } from "react";

type Props = Omit<ComponentPropsWithoutRef<"img">, "src" | "alt">;

export function DelicateArch({ className, ...props }: Props) {
  return (
    <img
      {...props}
      src="/icon.webp"
      alt=""
      aria-hidden={props["aria-hidden"] ?? true}
      className={className}
    />
  );
}
