import { useState } from 'react';
import type { UserProfile } from '../types';

export interface AuthState {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    name: 'Nguyễn Văn A',
    email: 'user@academic.edu.vn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const login = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
  };
}
