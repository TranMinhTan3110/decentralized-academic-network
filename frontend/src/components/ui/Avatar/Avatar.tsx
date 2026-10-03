import type { UserProfile } from '../../../types';

export interface AvatarProps {
  user?: UserProfile | null;
  name?: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ user, name, avatar, size = 'md', className = '' }: AvatarProps) {
  const displayName = name || user?.name || '?';
  const displayAvatar = avatar || user?.avatar;

  let sizeClass = 'w-9 h-9 text-[11px]';
  if (size === 'sm') sizeClass = 'w-7 h-7 text-[10px]';
  else if (size === 'lg') sizeClass = 'w-12 h-12 text-sm';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 bg-[#dce6ff] text-[#1d42d8] font-bold tracking-tight ${sizeClass} ${className}`.trim()}
      aria-label={`Ảnh đại diện của ${displayName}`}
    >
      {displayAvatar || displayName.charAt(0).toUpperCase()}
    </span>
  );
}
