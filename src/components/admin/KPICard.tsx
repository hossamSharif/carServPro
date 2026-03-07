import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_MAP: Record<string, string> = {
  yellow: 'bg-yellow-500/10 text-yellow-400',
  green: 'bg-emerald-500/10 text-emerald-400',
  red: 'bg-red-500/10 text-red-400',
  blue: 'bg-primary/10 text-primary',
};

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
}

export default function KPICard({ icon: Icon, label, value, color }: KPICardProps) {
  return (
    <div className="border rounded-lg bg-card p-5 hover:shadow-glow transition-shadow">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-full shrink-0',
            color ? COLOR_MAP[color] || 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground leading-tight">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}
