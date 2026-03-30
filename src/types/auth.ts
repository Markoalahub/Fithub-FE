export type UserRole = 'pm' | 'dev';
export type LoginProvider = 'github' | 'kakao';

export interface DemoAccount {
  id: string;
  role: UserRole;
  roleLabel: string;
  name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  provider: LoginProvider;
}

export const demoAccounts: DemoAccount[] = [
  {
    id: 'pm-001',
    role: 'pm',
    roleLabel: '기획자',
    name: '김기획',
    email: 'pm@fithub.demo',
    password: 'pm1234!',
  },
  {
    id: 'dev-001',
    role: 'dev',
    roleLabel: '개발자',
    name: '이개발',
    email: 'dev@fithub.demo',
    password: 'dev1234!',
  },
];
