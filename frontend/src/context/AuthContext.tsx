import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '../types';
import { authService, type UserDto, type AuthResponse } from '../services';

export interface AuthContextType {
    currentUser: UserProfile | null;
    userDto: UserDto | null;
    isAuthenticated: boolean;
    login: (authData: AuthResponse | UserProfile) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUserDtoToProfile = (dto: UserDto | null): UserProfile | null => {
    if (!dto) return null;
    return {
        id: dto.id,
        name: dto.fullName || dto.username || dto.email,
        email: dto.email,
        avatar: dto.avatarUrl || dto.avatarText || '',
        role: dto.role,
    };
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [userDto, setUserDto] = useState<UserDto | null>(() => authService.getCurrentUser());
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
        mapUserDtoToProfile(authService.getCurrentUser())
    );
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());

    useEffect(() => {
        const syncAuthState = () => {
            const user = authService.getCurrentUser();
            const authed = authService.isAuthenticated();
            setUserDto(user);
            setCurrentUser(mapUserDtoToProfile(user));
            setIsAuthenticated(authed);
        };

        window.addEventListener('storage', syncAuthState);
        return () => window.removeEventListener('storage', syncAuthState);
    }, []);

    const login = (authData: AuthResponse | UserProfile) => {
        if ('accessToken' in authData && 'user' in authData) {
            authService.setSession(authData);
            setUserDto(authData.user);
            setCurrentUser(mapUserDtoToProfile(authData.user));
            setIsAuthenticated(true);
        } else {
            setCurrentUser(authData as UserProfile);
            setIsAuthenticated(true);
        }
    };

    const logout = () => {
        authService.logout();
        setUserDto(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ currentUser, userDto, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        // Fallback for isolated tests without AuthProvider
        const localUser = authService.getCurrentUser();
        const authed = authService.isAuthenticated();
        return {
            currentUser: mapUserDtoToProfile(localUser),
            userDto: localUser,
            isAuthenticated: authed,
            login: () => {},
            logout: () => {},
        };
    }
    return context;
}
