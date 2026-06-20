import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { MOCK_USERS } from "../data/mockData";
import type { SessionUser } from "../types";

export const useSessionStore = defineStore("session", () => {
  const user = ref<SessionUser | null>(null);
  const isAuthenticated = computed(() => Boolean(user.value));
  const isAdmin = computed(() => user.value?.role === "administrador");

  function login(email: string, password: string) {
    const found = MOCK_USERS.find((item) => item.email === email && item.password === password);
    if (!found) return false;
    user.value = { name: found.name, avatar: found.avatar, email: found.email, role: found.role };
    return true;
  }

  function register(name: string, email: string) {
    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
    user.value = { name, avatar: initials || "CL", email, role: "cliente" };
  }

  function updateUser(next: SessionUser) {
    user.value = next;
  }

  function logout() {
    user.value = null;
  }

  return { user, isAuthenticated, isAdmin, login, register, updateUser, logout };
});
