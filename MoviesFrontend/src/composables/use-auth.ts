import { ref, type MaybeRefOrGetter, toValue } from "vue";
import { useRouter } from "vue-router";
import { authService } from "../services/auth.service";
import { useSessionStore } from "../stores/session";
import type { LoginInput, SignupInput, ForgotPasswordInput, ResetPasswordInput } from "../services/auth.service";

export function useAuth() {
  const isPending = ref(false);
  const error = ref<string | null>(null);
  const session = useSessionStore();
  const router = useRouter();

  function mapJwtRole(role: string): "cliente" | "administrador" | "recepcionista" {
    switch (role) {
      case "admin": return "administrador";
      case "client": return "cliente";
      case "receptionist": return "recepcionista";
      default: return "cliente";
    }
  }

  function decodeToken(token: string): Record<string, string> {
    try {
      const base64 = token.split(".")[1];
      return JSON.parse(atob(base64));
    } catch {
      return {};
    }
  }

  function buildSessionUser(token: string, fallbackEmail: string) {
    const decoded = decodeToken(token);
    const name = decoded.nombre || fallbackEmail;
    return {
      name,
      avatar: name.charAt(0).toUpperCase(),
      email: decoded.email || fallbackEmail,
      role: mapJwtRole(decoded.role),
    };
  }

  async function login(payload: LoginInput, redirectTo?: MaybeRefOrGetter<string>) {
    isPending.value = true;
    error.value = null;
    try {
      const res = await authService.login(payload);
      localStorage.setItem("access_token", res.access_token);
      session.user = buildSessionUser(res.access_token, payload.email);
      const target = toValue(redirectTo) || "/home";
      router.push(target);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function signup(payload: SignupInput, redirectTo?: MaybeRefOrGetter<string>) {
    isPending.value = true;
    error.value = null;
    try {
      const res = await authService.signup(payload);
      localStorage.setItem("access_token", res.access_token);
      session.user = buildSessionUser(res.access_token, payload.email);
      const target = toValue(redirectTo) || "/home";
      router.push(target);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarse";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function forgotPassword(payload: ForgotPasswordInput) {
    isPending.value = true;
    error.value = null;
    try {
      await authService.forgotPassword(payload);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar recuperación";
      error.value = msg;
      return false;
    } finally {
      isPending.value = false;
    }
  }

  async function resetPassword(payload: ResetPasswordInput) {
    isPending.value = true;
    error.value = null;
    try {
      await authService.resetPassword(payload);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al restablecer contraseña";
      error.value = msg;
      return false;
    } finally {
      isPending.value = false;
    }
  }

  function logout() {
    localStorage.removeItem("access_token");
    session.logout();
    router.push("/login");
  }

  return { isPending, error, login, signup, forgotPassword, resetPassword, logout };
}
