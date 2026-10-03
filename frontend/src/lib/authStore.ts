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
        avatar: '',
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
