import { z } from "zod";
import { apiClient } from "../lib/api-client";

// ── Zod schemas ────────────────────────────────────────────────────────────────

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

export const signupInputSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  telefono: z.string().optional(),
});
export type SignupInput = z.infer<typeof signupInputSchema>;

export const forgotPasswordInputSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const updateProfileInputSchema = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const updateNotificationsInputSchema = z.object({
  notificaciones_activas: z.boolean(),
});
export type UpdateNotificationsInput = z.infer<typeof updateNotificationsInputSchema>;

export const userProfileSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  email: z.string().email(),
  telefono: z.string().nullable().optional(),
  notificaciones_activas: z.boolean().optional(),
  id_rol: z.union([z.string(), z.number()]).optional(),
  estado: z.string().optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

export const loginResponseSchema = z.object({
  access_token: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const signupResponseSchema = z.object({
  message: z.string(),
  access_token: z.string(),
});
export type SignupResponse = z.infer<typeof signupResponseSchema>;

// ── Service ────────────────────────────────────────────────────────────────────

export const authService = {
  async login(payload: LoginInput): Promise<LoginResponse> {
    const { data } = await apiClient.post("/auth/login", payload);
    return loginResponseSchema.parse(data);
  },

  async signup(payload: SignupInput): Promise<SignupResponse> {
    const { data } = await apiClient.post("/auth/signup", payload);
    return signupResponseSchema.parse(data);
  },

  async forgotPassword(payload: ForgotPasswordInput): Promise<void> {
    await apiClient.post("/auth/forgot-password", payload);
  },

  async resetPassword(payload: ResetPasswordInput): Promise<void> {
    await apiClient.post("/auth/reset-password", payload);
  },

  async changePassword(id: string, payload: ChangePasswordInput): Promise<void> {
    await apiClient.put(`/users/${id}/password`, payload);
  },

  async getMe(): Promise<UserProfile> {
    const { data } = await apiClient.get("/users/me");
    return userProfileSchema.parse(data);
  },

  async updateProfile(id: string, payload: UpdateProfileInput): Promise<UserProfile> {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return userProfileSchema.parse(data);
  },

  async updateNotifications(id: string, payload: UpdateNotificationsInput): Promise<UserProfile> {
    const { data } = await apiClient.patch(`/users/${id}/notificaciones`, payload);
    return userProfileSchema.parse(data);
  },
};
