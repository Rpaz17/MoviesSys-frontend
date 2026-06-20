<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
  CalendarClock, ChevronDown, ChevronRight, Clapperboard, Film, LayoutGrid,
  Lock, LogOut, MapPin, Percent, Shield, Ticket, User,
} from "lucide-vue-next";
import { useSessionStore } from "../stores/session";

const router = useRouter();
const session = useSessionStore();
const open = ref(false);

const adminLinks = [
  { label: "Peliculas", to: "/admin/peliculas" },
  { label: "Funciones", to: "/admin/funciones" },
  { label: "Cines", to: "/admin/cines" },
  { label: "Ciudades", to: "/admin/ciudades" },
  { label: "Salas", to: "/admin/salas" },
  { label: "Clientes", to: "/admin/clientes" },
  { label: "Reportes", to: "/admin/reportes" },
  { label: "Cupones", to: "/admin/cupones" },
  { label: "Cancelaciones", to: "/admin/cancelaciones" },
];

const clientLinks = [
  { label: "Funciones", to: "/reservas/funciones" },
  { label: "Mis Reservas", to: "/reservas/mis-reservas" },
];

const links = computed(() => session.isAdmin ? adminLinks : clientLinks);
const publicLinks = [{ label: "Funciones", to: "/reservas/funciones" }];
const mobileLinks = computed(() => session.user ? links.value.slice(0, 4) : publicLinks);

function go(to: string) {
  open.value = false;
  router.push(to);
}

function logout() {
  open.value = false;
  session.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen w-full flex flex-col app-shell">
    <nav class="fixed top-0 left-0 right-0 z-50 navbar">
      <div class="nav-inner">
        <button class="flex items-center gap-2.5" @click="go(session.user ? '/home' : '/reservas/funciones')">
          <span class="brand-icon">
            <Film class="w-4 h-4 text-white" />
          </span>
          <span class="brand-text">Movie<span>Sys</span></span>
        </button>

        <div v-if="session.user" class="desktop-nav hidden md:flex items-center">
          <button v-for="link in links" :key="link.to" class="nav-link" @click="go(link.to)">
            {{ link.label }}
          </button>
        </div>
        <div v-else class="desktop-nav hidden md:flex items-center">
          <button v-for="link in publicLinks" :key="link.to" class="nav-link" @click="go(link.to)">
            {{ link.label }}
          </button>
        </div>

        <div class="flex items-center gap-3">
          <template v-if="session.user">
            <div class="relative">
              <button class="session-button" @click="open = !open">
                <span class="avatar">{{ session.user.avatar }}</span>
                <span class="hidden sm:flex flex-col items-start leading-none">
                  <span class="text-xs font-medium" style="color:#f0ece4">{{ session.user.name.split(' ')[0] }}</span>
                  <span class="role-line">
                    <Shield v-if="session.isAdmin" class="w-2.5 h-2.5" />
                    <User v-else class="w-2.5 h-2.5" />
                    {{ session.user.role }}
                  </span>
                </span>
                <ChevronDown class="w-3.5 h-3.5 text-slate-400 transition-transform" :style="{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }" />
              </button>
              <div v-if="open" class="dropdown">
                <div class="px-4 py-3 dropdown-head">
                  <p class="text-sm font-medium" style="color:#f0ece4">{{ session.user.name }}</p>
                  <p class="text-xs mt-0.5 mono" style="color:#7a7590">{{ session.user.email }}</p>
                </div>
                <button class="dropdown-item" @click="go('/profile')"><User class="w-3.5 h-3.5" /> Mi perfil</button>
                <button class="dropdown-item" @click="go('/change-password')"><Lock class="w-3.5 h-3.5" /> Cambiar contrasena</button>
                <template v-if="!session.isAdmin">
                  <button class="dropdown-item" @click="go('/reservas/mis-reservas')"><Ticket class="w-3.5 h-3.5" /> Mis reservas</button>
                </template>
                <template v-else>
                  <button class="dropdown-item" @click="go('/admin/reportes')"><Ticket class="w-3.5 h-3.5" /> Reportes</button>
                  <button class="dropdown-item" @click="go('/admin/funciones')"><CalendarClock class="w-3.5 h-3.5" /> Funciones</button>
                  <button class="dropdown-item" @click="go('/admin/cupones')"><Percent class="w-3.5 h-3.5" /> Cupones</button>
                  <button class="dropdown-item" @click="go('/admin/peliculas/crear')"><Clapperboard class="w-3.5 h-3.5" /> Nueva pelicula</button>
                  <button class="dropdown-item" @click="go('/admin/cines')"><MapPin class="w-3.5 h-3.5" /> Ver cines</button>
                  <button class="dropdown-item" @click="go('/admin/salas')"><LayoutGrid class="w-3.5 h-3.5" /> Ver salas</button>
                </template>
                <button class="dropdown-item logout" @click="logout"><LogOut class="w-3.5 h-3.5" /> Cerrar sesion</button>
              </div>
            </div>
          </template>
          <template v-else>
            <button v-if="$route.name !== 'login'" class="ghost-button" @click="go('/login')">Iniciar sesion</button>
            <button v-else class="primary-button" @click="go('/register')">Crear cuenta <ChevronRight class="w-3.5 h-3.5" /></button>
          </template>
        </div>
      </div>
    </nav>
    <router-view />
    <div v-if="session.user || $route.name === 'available-functions'" class="mobile-nav md:hidden">
      <button v-for="link in mobileLinks" :key="link.to" class="mobile-nav-link" @click="go(link.to)">
        {{ link.label }}
      </button>
    </div>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: #141320; color: #f0ece4; overflow-x: hidden; }
button, input, select, textarea { font-family: inherit; }

/* ── Layout shell ── */
.app-shell { font-family: 'Inter', sans-serif; background: #141320; }

/* ── Navbar ── */
.navbar {
  height: 60px;
  background: rgba(18,17,30,0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(200,169,110,0.08);
}
.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(1rem, 3vw, 2rem);
}

/* ── Brand ── */
.brand-icon {
  width: 30px; height: 30px;
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #c8102e, #8c0a1f);
  flex-shrink: 0;
}
.brand-text {
  font-family: 'Playfair Display', serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: #f0ece4;
  letter-spacing: -0.01em;
}
.brand-text span { color: #c8a96e; }

/* ── Desktop nav links ── */
.desktop-nav {
  gap: .25rem;
  max-width: 40vw;
  overflow-x: auto;
  scrollbar-width: none;
}
.desktop-nav::-webkit-scrollbar { display: none; }
.nav-link {
  flex: 0 0 auto;
  font-size: .8125rem;
  font-weight: 500;
  color: #6a6580;
  padding: .375rem .625rem;
  border-radius: 3px;
  transition: color .15s, background .15s;
  white-space: nowrap;
  letter-spacing: .01em;
}
.nav-link:hover { color: #c8a96e; background: rgba(200,169,110,0.07); }

/* ── Session button ── */
.session-button {
  display: flex; align-items: center; gap: .5rem;
  padding: .3125rem .625rem;
  border-radius: 3px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(200,169,110,0.15);
  transition: border-color .15s, background .15s;
}
.session-button:hover { border-color: rgba(200,169,110,0.3); background: rgba(200,169,110,0.06); }
.avatar {
  width: 1.625rem; height: 1.625rem;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: .7rem; font-weight: 700;
  color: #f0ece4;
  font-family: 'Playfair Display', serif;
  background: linear-gradient(135deg, #c8102e, #8c0a1f);
  flex-shrink: 0;
}
.role-line {
  font-size: 9px; margin-top: 2px;
  display: flex; align-items: center; gap: 3px;
  color: #6495ed;
  font-family: 'DM Mono', monospace;
  text-transform: uppercase;
  letter-spacing: .04em;
}

/* ── Dropdown ── */
.dropdown {
  position: absolute; right: 0; top: calc(100% + 6px);
  width: 13rem;
  border-radius: 4px;
  overflow: hidden;
  background: #171526;
  border: 1px solid rgba(200,169,110,0.12);
  box-shadow: 0 20px 60px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.3);
}
.dropdown-head { border-bottom: 1px solid rgba(255,255,255,0.05); padding: .875rem 1rem; }
.dropdown-item {
  width: 100%; display: flex; align-items: center; gap: .5rem;
  padding: .5625rem 1rem; font-size: .8125rem; text-align: left;
  color: #9e9ab0;
  transition: color .12s, background .12s;
}
.dropdown-item:hover { background: rgba(200,169,110,0.06); color: #c8a96e; }
.logout { border-top: 1px solid rgba(255,255,255,0.05); color: #e8607a; }
.logout:hover { background: rgba(232,96,122,0.07); color: #ff8099; }

/* ── Buttons ── */
.primary-button {
  display: inline-flex; align-items: center; justify-content: center; gap: .375rem;
  border-radius: 3px; padding: .5rem 1.125rem;
  font-size: .8125rem; font-weight: 600; letter-spacing: .01em;
  color: #f0ece4;
  background: linear-gradient(135deg, #c8102e, #8c0a1f);
  border: 1px solid rgba(200,16,46,0.4);
  transition: opacity .15s, transform .1s;
}
.primary-button:hover { opacity: .9; }
.primary-button:active { transform: scale(.98); }
.primary-button:disabled { opacity: .45; cursor: not-allowed; }

.ghost-button {
  display: inline-flex; align-items: center; justify-content: center; gap: .375rem;
  border-radius: 3px; padding: .5rem 1rem;
  font-size: .8125rem; font-weight: 500;
  color: #c8a96e;
  border: 1px solid rgba(200,169,110,0.22);
  background: rgba(200,169,110,0.05);
  transition: background .15s, border-color .15s;
}
.ghost-button:hover { background: rgba(200,169,110,0.1); border-color: rgba(200,169,110,0.35); }

/* ── Page container ── */
.page {
  flex: 1; width: 100%;
  padding: 5rem clamp(1rem, 3vw, 2rem) 3rem;
  background: #141320;
}
.page-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.5rem;
}
/* Centered content variant */
.page-centered {
  max-width: 680px;
  margin: 0 auto;
  display: flex; flex-direction: column; gap: 1.5rem;
}

/* ── Card ── */
.card {
  background: #1a1828;
  border: 1px solid rgba(200,169,110,0.1);
  border-radius: 4px;
}
.card:hover { border-color: rgba(200,169,110,0.16); }

/* ── Inputs ── */
.input {
  min-width: 0; width: 100%;
  background: #141220;
  border: 1px solid rgba(200,169,110,0.14);
  color: #f0ece4;
  outline: none;
  border-radius: 3px;
  padding: .6875rem 1rem;
  font-size: .875rem;
  transition: border-color .15s;
}
.input:focus { border-color: rgba(200,169,110,0.4); }
.input::placeholder { color: #4a4660; }

/* ── Pills ── */
.pill {
  display: inline-flex; align-items: center; gap: .375rem;
  border-radius: 2px; padding: .1875rem .5625rem;
  font-size: .6875rem; font-weight: 600; letter-spacing: .04em;
  font-family: 'DM Mono', monospace;
  text-transform: uppercase;
  background: rgba(200,169,110,0.1);
  color: #c8a96e;
  border: 1px solid rgba(200,169,110,0.2);
}

/* ── Utility ── */
.mono { font-family: 'DM Mono', monospace; }
.muted { color: #7a7590; }
.accent { color: #c8a96e; }
.danger { color: #e8607a; }
.success { color: #4caf7d; }

/* ── Mobile nav ── */
.mobile-nav {
  position: fixed; left: .75rem; right: .75rem; bottom: .75rem; z-index: 40;
  display: none;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: .25rem; padding: .3rem;
  border: 1px solid rgba(200,169,110,0.14);
  border-radius: 4px;
  background: rgba(18,17,28,0.97);
  backdrop-filter: blur(16px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.5);
}
.mobile-nav-link {
  min-height: 2.375rem;
  border-radius: 3px;
  padding: .3rem .45rem;
  color: #8a86a0;
  font-size: .75rem; line-height: 1.2; text-align: center;
  transition: color .12s, background .12s;
}
.mobile-nav-link:hover { background: rgba(200,169,110,0.07); color: #c8a96e; }

/* ── Responsive ── */
@media (max-width: 767px) {
  .navbar { height: 56px; }
  .page { padding-top: 4.5rem; padding-bottom: 5rem; }
  .brand-text { font-size: .9375rem; }
  .mobile-nav { display: grid; }
}
</style>
