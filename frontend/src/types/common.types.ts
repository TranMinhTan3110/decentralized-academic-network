export interface UserProfile {
  name: string;
  avatar?: string;
  email?: string;
}

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  public?: boolean;
}
