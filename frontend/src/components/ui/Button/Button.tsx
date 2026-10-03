import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'text' | 'upload';
  children?: ReactNode;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    children,
    icon,
    className = '',
    type = 'button',
    disabled,
    ...props
  },
  ref
) {
  let baseClass =
    'inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#315dff] focus-visible:outline-offset-2';

  if (variant === 'primary') {
    baseClass +=
      ' min-h-[40px] px-4 py-2 bg-[#315dff] text-white hover:bg-[#1d42d8] font-semibold text-xs rounded-[5px]';
  } else if (variant === 'secondary') {
    baseClass +=
      ' min-h-[40px] px-4 py-2 bg-white border border-[#bdb9b3] text-[#121827] hover:bg-[#f5f7fb] hover:border-[#315dff] hover:text-[#315dff] font-semibold text-xs rounded-[5px]';
  } else if (variant === 'icon') {
    baseClass +=
      ' w-11 h-11 rounded-[4px] text-[#5f6878] hover:bg-[#eaf0ff] hover:text-[#315dff]';
  } else if (variant === 'text') {
    baseClass +=
      ' py-2 text-[#315dff] underline underline-offset-4 hover:text-[#1d42d8] text-xs font-semibold';
  } else if (variant === 'upload') {
    baseClass +=
      ' min-h-[40px] px-3.5 py-2 bg-[#ee964b] text-[#14213d] hover:bg-[#d97f36] font-bold text-xs rounded-[5px]';
  }

  const combinedClasses = `${baseClass} ${className}`.trim();

  return (
    <button ref={ref} type={type} disabled={disabled} className={combinedClasses} {...props}>
      {icon}
      {children && (typeof children === 'string' ? <span>{children}</span> : children)}
    </button>
  );
});
