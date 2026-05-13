import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type PageBackProps = {
  href: string;
  label?: string;
  /** Pin to top-left of the viewport (e.g. auth screens). */
  fixed?: boolean;
  className?: string;
};

export function PageBack({ href, label = 'Back', fixed, className }: PageBackProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground',
        fixed &&
          'fixed left-4 top-4 z-50 border border-border bg-background/90 shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
