import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Options simples ; sinon passer des <option> via children. */
  options?: AdminSelectOption[];
  /** Option vide en tête (ex. "— Choisir —"). */
  placeholder?: string;
  children?: ReactNode;
}

/**
 * Select natif stylé comme l'Input shadcn (focus ring, hauteur, bordure).
 * Remplace la classe SELECT_CLASS dupliquée dans les modaux admin.
 */
export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ options, placeholder, children, className, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
      {children}
    </select>
  ),
);
AdminSelect.displayName = 'AdminSelect';
