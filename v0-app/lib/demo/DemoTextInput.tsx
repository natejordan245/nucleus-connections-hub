"use client";

import { useId } from "react";
import { useTypingAnimation } from "./useTypingAnimation";
import { DEMO_TEXT } from "./scenarios";
import { cn } from "@/lib/utils";

interface BaseProps {
  demoKey: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

interface InputProps extends BaseProps { rows?: undefined; multiline?: false }
interface TextareaProps extends BaseProps { rows?: number; multiline: true }

type Props = InputProps | TextareaProps;

/**
 * Double-click → animated typing of the canonical demo content for `demoKey`.
 * Real onChange fires per character so any downstream form state, validation,
 * or LLM extraction trigger sees a normal text-entry sequence.
 */
export function DemoTextInput(props: Props) {
  const { demoKey, value, onChange, placeholder, label, className } = props;
  const id = useId();
  const { typing, start } = useTypingAnimation({ onChange });

  function handleDoubleClick() {
    const target = DEMO_TEXT[demoKey];
    if (!target) return;
    start(target);
  }

  const shared = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.currentTarget.value),
    onDoubleClick: handleDoubleClick,
    placeholder,
    className: cn(
      "block w-full rounded border border-warmgray-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-orange-500 focus:ring-2 focus:ring-sand-50",
      typing && "demo-cursor",
      className
    ),
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-warmgray-500">
          {label}
          <span className="ml-2 text-[10px] uppercase tracking-wide text-orange-600">
            double-click to demo
          </span>
        </label>
      )}
      {"multiline" in props && props.multiline ? (
        <textarea {...shared} rows={props.rows ?? 6} />
      ) : (
        <input type="text" {...shared} />
      )}
    </div>
  );
}
