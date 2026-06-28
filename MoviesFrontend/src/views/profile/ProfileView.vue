<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { CheckCircle2, Save, User, XCircle, Bell, BellOff } from "lucide-vue-next";
import { useSessionStore } from "../../stores/session";
import { vName, vEmail } from "../../lib/validation";

const router = useRouter();
const session = useSessionStore();
const saved = ref(false);
const error = ref("");
const loading = ref(false);
const notifSaving = ref(false);
const notifError = ref("");
const notifSaved = ref(false);

const form = reactive({
  name: session.user?.name ?? "",
  email: session.user?.email ?? "",
  phone: session.user?.phone ?? "",
});

async function toggleNotifications() {
  notifError.value = "";
  notifSaved.value = false;
  notifSaving.value = true;
  const next = !session.user?.notifications;
  const ok = await session.toggleNotifications(next);
  notifSaving.value = false;
  if (ok) {
    notifSaved.value = true;
    setTimeout(() => (notifSaved.value = false), 2000);
  } else {
    notifError.value = "No se pudo actualizar la preferencia.";
  }
}

async function saveProfile() {
  error.value = "";
  saved.value = false;
  const validation = vName(form.name) || vEmail(form.email);
  if (validation) {
    error.value = validation;
    return;
  }
  loading.value = true;
  const ok = await session.updateProfile(form.name, form.email, form.phone);
  loading.value = false;
  if (ok) {
    saved.value = true;
  } else {
    error.value = "No se pudo actualizar el perfil.";
  }
}
</script>
<template>
  <div class="page">
    <div class="max-w-2xl mx-auto flex flex-col gap-5">
      <button class="text-xs muted text-left" @click="router.push('/home')">Inicio / Perfil</button>
      <div class="card p-6 flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded flex items-center justify-center"
            style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.18)">
            <User class="w-4 h-4 accent" />
          </div>
          <div>
            <h1 class="text-xl font-semibold"
              style="font-family:'Playfair Display',serif;color:#f0ece4;letter-spacing:-.01em">Mi perfil</h1>
            <p class="text-xs muted">{{ session.user?.email }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input v-model="form.name" class="input" placeholder="Nombre" />
          <input v-model="form.email" class="input" placeholder="Correo" />
          <input v-model="form.phone" class="input md:col-span-2" placeholder="Telefono" />
        </div>
        <p v-if="error" class="text-xs danger flex items-center gap-2">
          <XCircle class="w-4 h-4" /> {{ error }}
        </p>
        <p v-if="saved" class="text-xs success flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4" /> Perfil actualizado
        </p>
        <button class="primary-button justify-center py-3" :disabled="loading" @click="saveProfile">
          <Save class="w-4 h-4" /> {{ loading ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>

      <div class="card p-6 flex flex-col gap-3">
        <label class="notification-row">
          <span>
            <strong>Notificaciones</strong>
            <small>{{ session.user?.notifications ? "Recibir correos de reservas y promociones" :
              "Notificacionesdesactivadas" }}</small>
          </span>
          <button type="button" class="toggle-button"
            :class="{ active: session.user?.notifications, saving: notifSaving }" :disabled="notifSaving"
            @click="toggleNotifications">
            <component :is="session.user?.notifications ? Bell : BellOff" class="w-4 h-4" />
            {{ notifSaving ? "Guardando..." : session.user?.notifications ? "Activadas" : "Desactivadas" }}
          </button>
        </label>
        <p v-if="notifError" class="text-xs danger flex items-center gap-2">
          <XCircle class="w-4 h-4" /> {{ notifError }}
        </p>
        <p v-if="notifSaved" class="text-xs success flex items-center gap-2">
          <CheckCircle2 class="w-4 h-4" /> Preferencia actualizada
        </p>
      </div>
    </div>
  </div>
</template>
<style scoped>
.notification-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid rgba(200, 169, 110, .14);
  border-radius: 3px;
  padding: .875rem 1rem;
  background: rgba(200, 169, 110, .04);
}

.notification-row strong {
  display: block;
  color: #f0ece4;
  font-size: .875rem;
}

.notification-row small {
  display: block;
  color: #7a7590;
  font-size: .75rem;
  margin-top: .125rem;
}

.toggle-button {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: .8125rem;
  padding: .5rem .875rem;
  border-radius: 3px;
  border: 1px solid rgba(122, 117, 144, 0.2);
  background: rgba(122, 117, 144, 0.08);
  color: #7a7590;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}

.toggle-button.active {
  background: rgba(76, 175, 125, 0.08);
  border-color: rgba(76, 175, 125, 0.2);
  color: #4caf7d;
}

.toggle-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>