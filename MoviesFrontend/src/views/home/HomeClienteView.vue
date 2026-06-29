<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { CalendarClock, CreditCard, LogOut, Ticket, User } from "lucide-vue-next";
import { useSessionStore } from "../../stores/session";

const router = useRouter();
const session = useSessionStore();

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
});

function logout() {
  session.logout();
  router.push("/login");
}
</script>

<template>
  <div class="page hv-page">
    <div class="hv-wrap">
      <div class="hv-identity-card">
        <div class="hv-id-left">
          <div class="avatar hv-avatar">{{ session.user?.avatar }}</div>
          <div>
            <p class="hv-session-label">Sesion activa</p>
            <h2 class="hv-greeting">{{ greeting }}.</h2>
            <div class="hv-role-row">
              <User class="w-3 h-3 success" />
              <span class="mono" style="color:#4caf7d;font-size:11px;text-transform:uppercase;letter-spacing:.06em">{{ session.user?.role }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="hv-grid">
        <button class="hv-card hv-green" @click="router.push('/reservas/funciones')">
          <Ticket class="hv-card-icon" />
          <span class="hv-card-title">Funciones</span>
          <span class="hv-card-desc">Elegir funcion y reservar</span>
        </button>
        <button class="hv-card hv-blue" @click="router.push('/reservas/peliculas')">
          <CalendarClock class="hv-card-icon" />
          <span class="hv-card-title">Peliculas</span>
          <span class="hv-card-desc">Ver cines disponibles</span>
        </button>
        <button class="hv-card hv-gold" @click="router.push('/reservas/mis-reservas')">
          <Ticket class="hv-card-icon" />
          <span class="hv-card-title">Mis reservas</span>
          <span class="hv-card-desc">Historial y confirmaciones</span>
        </button>
        <button class="hv-card hv-gold" @click="router.push('/profile')">
          <User class="hv-card-icon" />
          <span class="hv-card-title">Perfil</span>
          <span class="hv-card-desc">Editar datos personales</span>
        </button>
        <button class="hv-card hv-red" @click="logout">
          <LogOut class="hv-card-icon" />
          <span class="hv-card-title">Cerrar sesion</span>
          <span class="hv-card-desc">Finalizar sesion activa</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hv-page { display: flex; align-items: flex-start; justify-content: center; }
.hv-wrap { width: 100%; max-width: 520px; display: flex; flex-direction: column; gap: 1.25rem; }

.hv-identity-card {
  background: #1a1828;
  border: 1px solid rgba(200,169,110,0.12);
  border-radius: 4px;
  padding: 1.375rem 1.5rem;
  display: flex; flex-direction: column; gap: 1rem;
}
.hv-id-left { display: flex; align-items: center; gap: 1rem; }
.hv-avatar { width: 3rem !important; height: 3rem !important; font-size: 1.125rem !important; }
.hv-greeting {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem; font-weight: 600;
  color: #f0ece4; margin: 0;
  line-height: 1.3;
}
.hv-session-label {
  font-family: 'DM Mono', monospace;
  font-size: .6875rem; text-transform: uppercase; letter-spacing: .08em;
  color: #7a7590; margin: 0 0 .25rem;
}
.hv-role-row { display: flex; align-items: center; gap: .375rem; margin-top: .25rem; }

.hv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .625rem;
}

.hv-card {
  display: flex; flex-direction: column; align-items: flex-start;
  gap: .375rem;
  padding: 1.125rem 1.125rem 1rem;
  border-radius: 4px;
  text-align: left;
  border: 1px solid transparent;
  transition: transform .12s, border-color .12s, background .12s;
}
.hv-card:hover { transform: translateY(-1px); }
.hv-card:active { transform: scale(.98); }

.hv-card-icon { width: 1.125rem; height: 1.125rem; margin-bottom: .25rem; }
.hv-card-title { font-size: .875rem; font-weight: 600; color: #f0ece4; line-height: 1.2; }
.hv-card-desc { font-size: .75rem; color: #7a7590; line-height: 1.3; }

.hv-gold { background: rgba(200,169,110,0.06); border-color: rgba(200,169,110,0.15); color: #c8a96e; }
.hv-gold:hover { background: rgba(200,169,110,0.1); border-color: rgba(200,169,110,0.28); }
.hv-green { background: rgba(76,175,125,0.06); border-color: rgba(76,175,125,0.15); color: #4caf7d; }
.hv-green:hover { background: rgba(76,175,125,0.1); border-color: rgba(76,175,125,0.28); }
.hv-blue { background: rgba(100,149,237,0.06); border-color: rgba(100,149,237,0.15); color: #6495ed; }
.hv-blue:hover { background: rgba(100,149,237,0.1); border-color: rgba(100,149,237,0.28); }
.hv-purple { background: rgba(142,68,173,0.07); border-color: rgba(178,120,214,0.16); color: #b878d6; }
.hv-purple:hover { background: rgba(142,68,173,0.12); border-color: rgba(178,120,214,0.3); }
.hv-red { background: rgba(200,16,46,0.05); border-color: rgba(200,16,46,0.15); color: #e8607a; }
.hv-red:hover { background: rgba(200,16,46,0.09); border-color: rgba(232,96,122,0.3); }
</style>
