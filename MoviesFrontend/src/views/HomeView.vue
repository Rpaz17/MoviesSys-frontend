<script setup lang="ts">
import { useRouter } from "vue-router";
import { BarChart3, CalendarClock, CheckCircle2, LogOut, MapPin, Percent, RefreshCcw, Shield, Ticket, User } from "lucide-vue-next";
import { useSessionStore } from "../stores/session";

const router = useRouter();
const session = useSessionStore();

function logout() {
  session.logout();
  router.push("/login");
}
</script>

<template>
  <div class="page hv-page">
    <div class="hv-wrap">
      <!-- User card -->
      <div class="hv-identity-card">
        <div class="hv-id-left">
          <div class="avatar hv-avatar">{{ session.user?.avatar }}</div>
          <div>
            <p class="hv-session-label">Sesion activa</p>
            <h2 class="hv-greeting">Hola, {{ session.user?.name.split(' ')[0] }}</h2>
            <div class="hv-role-row">
              <Shield v-if="session.isAdmin" class="w-3 h-3" style="color:#6495ed" />
              <User v-else class="w-3 h-3 success" />
              <span class="mono" :style="{ color: session.isAdmin ? '#6495ed' : '#4caf7d', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em' }">{{ session.user?.role }}</span>
            </div>
          </div>
        </div>
        <div class="hv-token-badge">
          <div>
            <p class="hv-token-title">Token activo</p>
            <p class="mono muted" style="font-size:.75rem">{{ session.user?.email }}</p>
          </div>
          <CheckCircle2 class="w-4 h-4 success flex-shrink-0" />
        </div>
      </div>

      <!-- Action grid -->
      <div class="hv-grid">
        <template v-if="session.isAdmin">
          <button class="hv-card hv-blue" @click="router.push('/admin/reportes')">
            <BarChart3 class="hv-card-icon" />
            <span class="hv-card-title">Reportes</span>
            <span class="hv-card-desc">Reservas, pagos y CSV</span>
          </button>
          <button class="hv-card hv-purple" @click="router.push('/admin/cupones')">
            <Percent class="hv-card-icon" />
            <span class="hv-card-title">Cupones</span>
            <span class="hv-card-desc">Crear y activar descuentos</span>
          </button>
          <button class="hv-card hv-gold" @click="router.push('/admin/funciones')">
            <CalendarClock class="hv-card-icon" />
            <span class="hv-card-title">Funciones</span>
            <span class="hv-card-desc">Pelicula, cine, sala y hora</span>
          </button>
          <button class="hv-card hv-green" @click="router.push('/admin/ciudades')">
            <MapPin class="hv-card-icon" />
            <span class="hv-card-title">Ciudades</span>
            <span class="hv-card-desc">CRUD de ciudades</span>
          </button>
          <button class="hv-card hv-blue" @click="router.push('/admin/cancelaciones')">
            <RefreshCcw class="hv-card-icon" />
            <span class="hv-card-title">Cancelaciones</span>
            <span class="hv-card-desc">Politica y reembolsos</span>
          </button>
        </template>
        <template v-else>
          <button class="hv-card hv-green" @click="router.push('/reservas/funciones')">
            <Ticket class="hv-card-icon" />
            <span class="hv-card-title">Funciones</span>
            <span class="hv-card-desc">Elegir funcion y reservar</span>
          </button>
          <button class="hv-card hv-gold" @click="router.push('/reservas/mis-reservas')">
            <Ticket class="hv-card-icon" />
            <span class="hv-card-title">Mis reservas</span>
            <span class="hv-card-desc">Historial y confirmaciones</span>
          </button>
        </template>
        <button class="hv-card hv-gold" @click="router.push('/profile')">
          <User class="hv-card-icon" />
          <span class="hv-card-title">Mi perfil</span>
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

/* Identity card */
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

.hv-token-badge {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  background: rgba(76,175,125,0.05);
  border: 1px solid rgba(76,175,125,0.15);
  border-radius: 4px;
  padding: .75rem 1rem;
}
.hv-token-title { font-size: .75rem; color: #4caf7d; margin: 0 0 .125rem; font-weight: 500; }

/* Action grid */
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

/* Color variants */
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
