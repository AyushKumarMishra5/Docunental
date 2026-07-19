/**
 * Empty State Component
 */

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-panel border border-border mb-6">
        <Icon className="h-8 w-8 text-text-muted" />
      </div>
      <h3 className="font-display text-xl text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-6 max-w-md">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
