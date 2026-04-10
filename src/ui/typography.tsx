import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../lib/utils';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-6xl font-bold tracking-tight text-foreground',
      h2: 'text-5xl font-semibold tracking-tight text-foreground',
      h3: 'text-4xl font-semibold tracking-tight text-foreground',
      h4: 'text-3xl font-semibold tracking-tight text-foreground',
      h5: 'text-2xl font-semibold tracking-tight text-foreground',
      h6: 'text-xl font-semibold tracking-tight text-foreground',
      body1: 'text-base text-foreground',
      body2: 'text-sm text-foreground',
      caption: 'text-xs text-muted-foreground',
      overline: 'text-xs uppercase tracking-wide text-muted-foreground',
      muted: 'text-sm text-muted-foreground',
      inherit: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'body1',
  },
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  asChild?: boolean;
}

function getDefaultElement(variant: string): keyof React.JSX.IntrinsicElements {
  switch (variant) {
    case 'h1':
      return 'h1';
    case 'h2':
      return 'h2';
    case 'h3':
      return 'h3';
    case 'h4':
      return 'h4';
    case 'h5':
      return 'h5';
    case 'h6':
      return 'h6';
    case 'caption':
    case 'overline':
      return 'span';
    default:
      return 'p';
  }
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : getDefaultElement(variant || 'body1');
    return <Comp className={cn(typographyVariants({ variant }), className)} ref={ref} {...props} />;
  },
);
Typography.displayName = 'Typography';

export { Typography };
