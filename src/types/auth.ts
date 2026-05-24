export type UserRole = "pm" | "dev-fe" | "dev-be" | "dev";
export type LoginProvider = "github" | "kakao";

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  provider: LoginProvider;
}
