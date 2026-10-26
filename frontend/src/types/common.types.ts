import type { ComponentType } from 'react';

export interface UserProfile {
  id?: string;
  name: string;
  avatar?: string;
  email?: string;
  role?: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number | string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  public?: boolean;
}
