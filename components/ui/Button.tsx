import * as React from "react";
import { cn } from "@/lib/cn";

type ResolvedVariant = "default" | "secondary" | "outline" | "ghost" | "link";
type ButtonVariant = ResolvedVariant | "primary";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ResolvedVariant, string> = {
  default:
    "bg-[var(--blue)] text-white hover:bg-[var(--blue-contrast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
  secondary:
    "bg-[var(--green)] text-white hover:bg-[var(--green-contrast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500",
  outline:
    "border border-[var(--border-subtle)] bg-white text-ink hover:bg-[var(--cream)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
  ghost:
    "bg-transparent text-ink hover:bg-[var(--cream)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
  link: "bg-transparent text-[var(--blue)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-sm",
  lg: "h-11 px-6 text-base",
  icon: "h-9 w-9 p-0",
};

type ButtonProps<T extends React.ElementType = "button"> = {
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} & React.ComponentPropsWithoutRef<T>;

function resolveVariant(variant: ButtonVariant): ResolvedVariant {
  if (variant === "primary") return "default";
  return variant;
}

export function Button<T extends React.ElementType = "button">({
  as,
  variant = "default",
  size = "default",
  className,
  ...rest
}: ButtonProps<T>) {
  const Tag = as ?? "button";
  const resolvedVariant = resolveVariant(variant);
  return (
    <Tag
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        sizeClasses[size] ?? sizeClasses.default,
        variantClasses[resolvedVariant] ?? variantClasses.default,
        className,
      )}
      {...rest}
    />
  );
}

export default Button;
