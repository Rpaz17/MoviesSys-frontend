<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { CheckCircle2, Save, User, XCircle } from "lucide-vue-next";
import { useSessionStore } from "../../stores/session";
import { vName, vEmail } from "../../lib/validation";

const router = useRouter();
const session = useSessionStore();
const saved = ref(false);
const error = ref("");
const loading = ref(false);

const form = reactive({
  name: session.user?.name ?? "",
  email: session.user?.email ?? "",
  phone: session.user?.phone ?? "",
  notifications: session.user?.notifications ?? true,
});

async function saveProfile() {
  error.value = "";
  saved.value = false;
  const validation = vName(form.name) || vEmail(form.email);
  if (validation) {
    error.value = validation;
    return;
  }
  loading.value = true;
  const ok = await session.updateProfile(form.name, form.email, form.phone, form.notifications);
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
          <div class="w-10 h-10 rounded flex items-center justify-center" style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.18)">
            <User class="w-4 h-4 accent" />
          </div>
          <div>
            <h1 class="text-xl font-semibold" style="font-family:'Playfair Display',serif;color:#f0ece4;letter-spacing:-.01em">Mi perfil</h1>
            <p class="text-xs muted">{{ session.user?.email }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input v-model="form.name" class="input" placeholder="Nombre" />
          <input v-model="form.email" class="input" placeholder="Correo" />
          <input v-model="form.phone" class="input md:col-span-2" placeholder="Telefono" />
          <label class="notification-row md:col-span-2">
            <span>
              <strong>Notificaciones</strong>
              <small>{{ form.notifications ? "Recibir correos de reservas y promociones" : "Notificaciones desactivadas" }}</small>
            </span>
            <input v-model="form.notifications" type="checkbox" />
          </label>
        </div>
        <p v-if="error" class="text-xs danger flex items-center gap-2"><XCircle class="w-4 h-4" /> {{ error }}</p>
        <p v-if="saved" class="text-xs success flex items-center gap-2"><CheckCircle2 class="w-4 h-4" /> Perfil actualizado</p>
        <button class="primary-button justify-center py-3" :disabled="loading" @click="saveProfile"><Save class="w-4 h-4" /> {{ loading ? 'Guardando...' : 'Guardar cambios' }}</button>
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
  border: 1px solid rgba(200,169,110,.14);
  border-radius: 3px;
  padding: .875rem 1rem;
  background: rgba(200,169,110,.04);
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
.notification-row input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: #c8a96e;
}
</style>
