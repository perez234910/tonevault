"use client";

import * as Select from "@radix-ui/react-select";
import { Icon } from "./icon";

export type SelectOption = { value: string; label: string };
const ALL = "__all__";

/** One accessible, portaled storefront Select; Radix owns focus/typeahead/collision handling. */
export function StoreSelect({ label, value, options, onChange, disabled = false }: {
  label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; disabled?: boolean;
}) {
  const choices = options.some((option) => option.value === value) ? options : [...options, { value, label: `Custom ${label.toLowerCase()}` }];
  return <Select.Root value={value || ALL} onValueChange={(next) => onChange(next === ALL ? "" : next)} disabled={disabled}>
    <Select.Trigger aria-label={label} className="store-select-trigger"><Select.Value /><Select.Icon><Icon name="chevron" size={13} /></Select.Icon></Select.Trigger>
    <Select.Portal><Select.Content position="popper" sideOffset={6} collisionPadding={12} className="store-select-content">
      <Select.ScrollUpButton className="store-select-scroll" aria-label="Scroll options up">↑</Select.ScrollUpButton>
      <Select.Viewport>{choices.map((option) => <Select.Item key={option.value || ALL} value={option.value || ALL} className="store-select-item">
        <Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator><Icon name="check" size={14} /></Select.ItemIndicator>
      </Select.Item>)}</Select.Viewport>
      <Select.ScrollDownButton className="store-select-scroll" aria-label="Scroll options down">↓</Select.ScrollDownButton>
    </Select.Content></Select.Portal>
  </Select.Root>;
}
