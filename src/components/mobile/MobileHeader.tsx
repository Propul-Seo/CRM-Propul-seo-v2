import { memo, ReactNode } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
  transparent?: boolean;
}

export const MobileHeader = memo(function MobileHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions,
  className,
  transparent = false,
}: MobileHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <header
      className={cn(
        "md:hidden sticky top-0 z-40 border-b transition-colors duration-200",
        transparent
          ? "bg-transparent border-transparent"
          : "bg-surface-2 border-border",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left section - Back button or spacer */}
        <div className="flex items-center w-16">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-surface-3 transition-colors active:scale-95"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Center - Title */}
        <div className="flex-1 text-center min-w-0 px-2">
          <h1 className="text-lg font-semibold text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center justify-end w-16">
          {actions}
        </div>
      </div>
    </header>
  );
});

/**
 * Header mobile avec grande zone de titre et actions
 */
interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const MobilePageHeader = memo(function MobilePageHeader({
  title,
  subtitle,
  children,
  actions,
  className,
}: MobilePageHeaderProps) {
  return (
    <div className={cn("md:hidden px-4 py-4 bg-surface-2", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 ml-4">
            {actions}
          </div>
        )}
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
});

export default MobileHeader;
