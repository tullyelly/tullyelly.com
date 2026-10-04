import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type DataAttributes = {
  [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
};

export type ScrollCalloutProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> &
  DataAttributes & {
    children: ReactNode;
    label: ReactNode;
    bodyClassName?: string;
    labelClassName?: string;
    labelStyle?: CSSProperties;
    contentClassName?: string;
  };

const bodyBaseClassName =
  "relative block w-full rounded-lg px-4 py-4 text-[16px] font-medium leading-relaxed shadow-sm md:px-5 md:py-5 md:text-[18px] [&_a]:rounded [&_a]:px-1 [&_a]:underline [&_a]:transition-colors [&_a]:duration-150 [&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2";

const labelBaseClassName =
  "absolute left-0 top-0 inline-flex items-center rounded-tl-lg rounded-tr-none rounded-br-md px-4 py-1 text-sm font-semibold leading-none shadow-sm md:px-5";

const contentBaseClassName = "block pt-1.5 md:pt-2";

export function ScrollCallout({
  children,
  className,
  bodyClassName,
  contentClassName,
  label,
  labelClassName,
  labelStyle,
  role = "note",
  ...props
}: ScrollCalloutProps) {
  return (
    <span
      data-scroll-callout
      role={role}
      className={cn(bodyBaseClassName, bodyClassName, className)}
      {...props}
    >
      <span
        className={cn(labelBaseClassName, labelClassName)}
        style={labelStyle}
      >
        {label}
      </span>
      <span
        data-scroll-callout-content
        className={cn(contentBaseClassName, contentClassName)}
      >
        {children}
      </span>
    </span>
  );
}
