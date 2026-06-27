import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { authService } from "../services/auth.service";
import type { SessionUser } from "../types";

export const useSessionStore = defineStore("session", () => {
  const user = ref<SessionUser | null>(null);
  const isAuthenticated = computed(() => Boolean(user.value));
  const isAdmin = computed(() => user.value?.role === "administrador");
  const isReceptionist = computed(() => user.value?.role === "recepcionista");

  function mapRole(role: string): SessionUser["role"] {
    switch (role) {
      case "admin": return "administrador";
      case "client": return "cliente";
      case "receptionist": return "recepcionista";
      default: return "cliente";
    }
  }

  function decodeToken(token: string): Record<string, string> {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return {};
    }
  }

  function extractUserId(decoded: Record<string, string>): string {
    return decoded.sub || decoded.id || decoded.userId || decoded.user_id || decoded.usuario_id || "";
  }

  function setUserFromToken(token: string, fallbackEmail: string) {
    const decoded = decodeToken(token);
    const name = decoded.nombre || fallbackEmail;
    user.value = {
      id: extractUserId(decoded),
      name,
      avatar: name.charAt(0).toUpperCase(),
      email: decoded.email || fallbackEmail,
      role: mapRole(decoded.role),
    };
  }

  function restoreSession() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const decoded = decodeToken(token);
      if (decoded.exp && Date.now() >= Number(decoded.exp) * 1000) {
        localStorage.removeItem("access_token");
        return;
      }
      const name = decoded.nombre || decoded.email || "";
      user.value = {
        id: extractUserId(decoded),
        name,
        avatar: name.charAt(0).toUpperCase(),
        email: decoded.email || "",
        role: mapRole(decoded.role),
      };
    } catch {
      localStorage.removeItem("access_token");
    }
  }

  restoreSession();

  async function login(email: string, password: string): Promise<boolean> {
    try {
      const res = await authService.login({ email, password });
      localStorage.setItem("access_token", res.access_token);
      setUserFromToken(res.access_token, email);
      return true;
    } catch {
      return false;
    }
  }

  async function register(name: string, email: string, password: string): Promise<boolean> {
    try {
      const res = await authService.signup({ nombre: name, email, password });
      localStorage.setItem("access_token", res.access_token);
      const decoded = decodeToken(res.access_token);
      const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
      user.value = {
        id: extractUserId(decoded),
        name,
        avatar: initials || "CL",
        email,
        role: "cliente",
      };
      return true;
    } catch {
      return false;
    }
  }

  function updateUser(next: SessionUser) {
    user.value = next;
  }

  function logout() {
    localStorage.removeItem("access_token");
    user.value = null;
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const token = localStorage.getItem("access_token");
    if (!token) return false;
    const decoded = decodeToken(token);
    const userId = extractUserId(decoded);
    if (!userId) {
      console.warn("changePassword: no se encontro ID de usuario en el token. Claims disponibles:", Object.keys(decoded));
      return false;
    }
    try {
      await authService.changePassword(userId, { currentPassword, newPassword });
      return true;
    } catch {
      return false;
    }
  }

  return { user, isAuthenticated, isAdmin, isReceptionist, login, register, updateUser, logout, changePassword };
});
