import type { InputHTMLAttributes, FormEvent, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../Button';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: ReactNode;
    rightIcon?: ReactNode;
}

export function Input({ label, error, hint, icon, rightIcon, className = '', id, ...props }: InputProps) {
    return (
        <label className="block text-xs font-semibold text-[#121827] mt-5" htmlFor={id}>
            {label && <span className="block mb-2">{label}</span>}
            <div className="relative flex items-center">
                {icon && <span className="absolute left-3 flex text-[#5f6878] pointer-events-none">{icon}</span>}
                <input
                    id={id}
                    className={`w-full h-11 px-3 bg-white border-2 border-[#aebbd0] rounded-[7px] text-xs text-[#121827] placeholder:text-[#5f6878] focus:border-[#315dff] focus:outline-none transition-colors ${
                        icon ? 'pl-10' : ''
                    } ${rightIcon ? 'pr-10' : ''} ${error ? '!border-[#b42318]' : ''} ${className}`.trim()}
                    {...props}
                />
                {rightIcon && <span className="absolute right-3 flex items-center z-10">{rightIcon}</span>}
            </div>
            {hint && <span className="text-[10px] text-[#5f6878] mt-1.5 block font-normal">{hint}</span>}
            {error && <span className="text-[11px] text-[#b42318] mt-1 block font-normal">{error}</span>}
        </label>
    );
}

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
    variant?: 'topbar' | 'discovery';
    onSearchSubmit?: (e: FormEvent) => void;
    buttonText?: string;
    buttonIcon?: ReactNode;
}

export function SearchInput({
    variant = 'topbar',
    onSearchSubmit,
    buttonText,
    buttonIcon,
    className = '',
    value,
    onChange,
    placeholder = 'Tìm tài liệu...',
    ...props
}: SearchInputProps) {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (onSearchSubmit) {
            onSearchSubmit(e);
        }
    };

    if (variant === 'discovery') {
        return (
            <form
                className={`flex items-center gap-3 p-2 pl-4 border-2 border-[#315dff] border-l-[8px] border-l-[#ee964b] bg-[#f7f9ff] shadow-[5px_5px_0_#dce5ff] rounded-[5px] min-h-[68px] ${className}`.trim()}
                role="search"
                onSubmit={handleSubmit}
            >
                <Search size={22} className="text-[#315dff] shrink-0" aria-hidden="true" />
                <input
                    className="flex-1 w-full h-12 border-none bg-transparent outline-none text-xs md:text-sm text-[#121827] placeholder:text-[#5f6878]"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                {buttonText && (
                    <Button type="submit" variant="primary" icon={buttonIcon}>
                        {buttonText}
                    </Button>
                )}
            </form>
        );
    }

    return (
        <form
            className={`flex items-center gap-3 px-3.5 h-11 border border-[#dbe4f0] bg-[#f8faff] focus-within:border-[#315dff] focus-within:bg-white focus-within:shadow-sm rounded-[10px] text-[#64748b] transition-all w-full ${className}`.trim()}
            role="search"
            onSubmit={handleSubmit}
        >
            <Search size={18} className="shrink-0 text-[#94a3b8]" aria-hidden="true" />
            <input
                className="w-full h-full border-none bg-transparent outline-none text-xs text-[#0f172a] placeholder:text-[#94a3b8]"
                aria-label="Tìm tài liệu nhanh"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...props}
            />
        </form>
    );
}
