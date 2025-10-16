import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
                secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
                outline: 'text-foreground',
                success: 'border border-success bg-success/10 text-success hover:bg-success/20',
                warning: 'border border-warning bg-warning/10 text-warning hover:bg-warning/20',
                info: 'border border-info bg-info/10 text-info hover:bg-info/20',
                'outline-green': 'border border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/20',
                'outline-red': 'border border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20',
                'outline-blue': 'border border-blue-500 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
