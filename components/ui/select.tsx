import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/cn';

export const Select = SelectPrimitive.Root;

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn('inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm', className)}
    {...props}
  />
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectValue = SelectPrimitive.Value;

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn('z-50 overflow-hidden rounded-md border bg-white shadow', className)}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {props.children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn('relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm focus:bg-neutral-100', className)}
    {...props}
  >
    <SelectPrimitive.ItemText />
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
