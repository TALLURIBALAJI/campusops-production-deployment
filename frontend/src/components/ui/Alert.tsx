import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'default',
  title,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-background text-foreground border-border',
    destructive: 'border-destructive/20 bg-destructive/5 text-destructive',
    warning: 'border-warning/20 bg-amber-50 text-amber-800',
    info: 'border-info/20 bg-sky-50 text-sky-800',
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative mb-5 flex gap-3 rounded-lg border p-4 text-sm [&>svg]:size-4 [&>svg]:shrink-0',
        variants[variant],
        className
      )}
      {...props}
    >
      <AlertCircle className="mt-0.5" />
      <div className="space-y-1">
        {title && <h5 className="font-semibold leading-tight tracking-tight">{title}</h5>}
        <div className="text-xs leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
};
