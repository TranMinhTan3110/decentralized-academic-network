export type UserRole = 'ADMIN' | 'USER' | 'VIP';
export type UserStatus = 'ACTIVE' | 'BANNED' | 'UNVERIFIED';

export interface AdminUser {
    id: string;
    fullName: string;
    username: string;
    email: string;
    school: string;
    faculty: string;
    role: UserRole;
    status: UserStatus;
    documentsCount: number;
    reputation: number;
    tokenBalance: number;
    joinedDate: string;
}

export type SchoolFilter = 'ALL' | 'HUST' | 'NEU' | 'PTIT' | 'FTU' | 'UEH';
export type RoleFilter = 'ALL' | UserRole;
export type StatusFilter = 'ALL' | UserStatus;

