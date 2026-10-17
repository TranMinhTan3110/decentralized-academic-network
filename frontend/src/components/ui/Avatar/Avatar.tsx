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
  const isImageUrl = typeof displayAvatar === 'string' && (
    displayAvatar.startsWith('http://') ||
    displayAvatar.startsWith('https://') ||
    displayAvatar.startsWith('/') ||
    displayAvatar.startsWith('data:')
  );

  let sizeClass = 'w-9 h-9 text-[11px]';
  if (size === 'sm') sizeClass = 'w-7 h-7 text-[10px]';
  else if (size === 'lg') sizeClass = 'w-12 h-12 text-sm';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden bg-[#dce6ff] text-[#1d42d8] font-bold tracking-tight select-none relative ${sizeClass} ${className}`.trim()}
      aria-label={`Ảnh đại diện của ${displayName}`}
    >
      {isImageUrl ? (
        <img
          src={displayAvatar}
          alt={displayName}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        displayAvatar || displayName.charAt(0).toUpperCase()
      )}
    </span>
  );
}
