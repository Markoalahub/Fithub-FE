export type UserRole = "pm" | "dev-fe" | "dev-be";
export type LoginProvider = "github";

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  provider: LoginProvider;
}
