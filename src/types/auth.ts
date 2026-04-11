export type UserRole = "pm" | "dev-fe" | "dev-be";
export type LoginProvider = "github" | "kakao";

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
    id: "pm-001",
    role: "pm",
    roleLabel: "기획자",
    name: "김기획",
    email: "pm@fithub.demo",
    password: "pm1234!",
  },
  {
    id: "dev-fe-001",
    role: "dev-fe",
    roleLabel: "프론트엔드 개발자",
    name: "이프론트",
    email: "fe@fithub.demo",
    password: "fe1234!",
  },
  {
    id: "dev-be-001",
    role: "dev-be",
    roleLabel: "백엔드 개발자",
    name: "박백엔드",
    email: "be@fithub.demo",
    password: "be1234!",
  },
];
