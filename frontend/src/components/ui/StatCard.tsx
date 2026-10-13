import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  note: string;
  loading?: boolean;
  tone?: 'indigo' | 'green' | 'blue' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  note,
  loading = false,
  tone = 'indigo',
}) => {
  const tones = {
    indigo: 'bg-accent text-primary',
    green: 'bg-success-soft text-success',
    blue: 'bg-info/10 text-info',
    amber: 'bg-warning/10 text-warning',
  };

  return (
    <Card className="p-5 sm:p-6 transition-all hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-2 font-display text-[28px] font-bold leading-none tracking-tight text-foreground">
              {value}
            </p>
          )}
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md transition-transform hover:scale-105',
            tones[tone]
          )}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">{note}</p>
    </Card>
  );
};
