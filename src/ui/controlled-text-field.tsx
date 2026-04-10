'use client';

import * as React from 'react';
import { FieldValues, UseControllerProps, useController } from 'react-hook-form';
import { IMaskInput } from 'react-imask';

import { cn } from '../lib/utils';
import { FormItem, FormDescription } from './form-field';
import { Input } from './input';
import { Label } from './label';

type MaskedInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  mask: string;
  maskOptions?: Record<string, unknown>;
};

const IMaskWrapper = React.forwardRef<HTMLInputElement, MaskedInputProps>(function MaskedInput(
  { onChange, mask, maskOptions = {}, value, ...props },
  inputRef,
) {
  return (
    <IMaskInput
      {...props}
      {...maskOptions}
      value={String(value ?? '')}
      inputRef={inputRef}
      mask={mask}
      onAccept={(value: unknown, _: unknown, event: unknown) => {
        onChange?.({
          ...(event as React.ChangeEvent<HTMLInputElement>),
          target: {
            name: props.name as string,
            value: value as string,
          } as unknown as EventTarget & HTMLInputElement,
        });
      }}
    />
  );
});

type ControlledTextFieldProps<TFieldValues extends FieldValues = FieldValues> =
  UseControllerProps<TFieldValues> & {
    label?: string;
    placeholder?: string;
    helperText?: string | React.ReactNode | null;
    description?: string;
    mask?: string;
    maskOptions?: Record<string, unknown>;
    type?: string;
    className?: string;
    disabled?: boolean;
    autoComplete?: string;
    required?: boolean;
    trigger?: (name?: string | string[]) => Promise<boolean>;
    children?: React.ReactNode;
    showPassword?: boolean;
    disableHelperText?: boolean;
    _formControlProps?: React.HTMLAttributes<HTMLDivElement>;
  };

export const ControlledTextField = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  shouldUnregister,
  label,
  placeholder,
  helperText,
  description,
  mask,
  maskOptions = {},
  type = 'text',
  className,
  disabled,
  autoComplete,
  required,
  trigger,
  children,
  showPassword,
  disableHelperText,
  _formControlProps,
}: ControlledTextFieldProps<TFieldValues>) => {
  const { field, fieldState } = useController<TFieldValues>({
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
  });

  const { error } = fieldState;

  const getHelperText = () => {
    if (disableHelperText) return null;
    if (error) return error.message;
    return helperText || description;
  };

  const displayHelperText = getHelperText();
  const inputType = type === 'password' && Boolean(showPassword) ? 'text' : type;

  return (
    <FormItem className={cn('w-full', className)} {..._formControlProps}>
      {label && (
        <Label className={error ? 'text-destructive' : ''}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        {mask ? (
          <IMaskWrapper
            {...field}
            mask={mask}
            maskOptions={maskOptions}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            required={required}
            className={cn(
              'flex h-10 w-full rounded-[5px] border border-input bg-card px-3 py-2 text-base md:text-sm ring-offset-background',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus-visible:ring-destructive',
            )}
            onBlur={() => {
              field.onBlur();
              if (trigger) trigger(name);
            }}
          />
        ) : (
          <Input
            {...field}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            required={required}
            className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
            onBlur={(e) => {
              if (e.target.value !== field.value) {
                field.onChange(e.target.value);
              }
              field.onBlur();
              if (trigger) trigger(name);
            }}
          />
        )}
        {children && (
          <div className="absolute right-0 top-0 h-10 flex items-center pr-3">{children}</div>
        )}
      </div>
      {displayHelperText && !error && <FormDescription>{displayHelperText}</FormDescription>}
      {error && <p className="text-sm font-medium text-destructive">{error.message}</p>}
    </FormItem>
  );
};
