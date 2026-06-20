<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CheckCircle2, KeyRound, Save, User } from "lucide-vue-next";
import { useSessionStore } from "../stores/session";
import { vEmail, vName, vPass, vConfirm } from "../lib/validation";

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const mode = computed(() => route.meta.mode);
const saved = ref(false);
const form = reactive({
  name: session.user?.name ?? "",
  email: session.user?.email ?? "",
  phone: "",
  current: "",
  next: "",
  confirm: "",
});
const error = ref("");

function saveProfile() {
  const validation = vName(form.name) || vEmail(form.email);
  if (validation) {
    error.value = validation;
    return;
  }
  session.updateUser({ ...(session.user!), name: form.name, email: form.email });
  saved.value = true;
}

function savePassword() {
  const validation = vPass(form.next) || vConfirm(form.next, form.confirm);
  if (validation) {
    error.value = validation;
    return;
  }
  saved.value = true;
}
</script>

<template>
  <div class="page">
    <div class="max-w-2xl mx-auto flex flex-col gap-5">
      <button class="text-xs muted text-left" @click="router.push('/home')">Inicio / {{ mode === 'password' ? 'Cambiar contrasena' : 'Perfil' }}</button>
      <div class="card p-6 flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded flex items-center justify-center" style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.18)">
            <KeyRound v-if="mode === 'password'" class="w-4 h-4 accent" />
            <User v-else class="w-4 h-4 accent" />
          </div>
          <div>
            <h1 class="text-xl font-semibold" style="font-family:'Playfair Display',serif;color:#f0ece4;letter-spacing:-.01em">{{ mode === 'password' ? 'Cambiar contrasena' : 'Mi perfil' }}</h1>
            <p class="text-xs muted">{{ session.user?.email }}</p>
          </div>
        </div>
        <div v-if="mode !== 'password'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input v-model="form.name" class="input" placeholder="Nombre" />
          <input v-model="form.email" class="input" placeholder="Correo" />
          <input v-model="form.phone" class="input md:col-span-2" placeholder="Telefono" />
        </div>
        <div v-else class="grid grid-cols-1 gap-4">
          <input v-model="form.current" class="input" type="password" placeholder="Contrasena actual" />
          <input v-model="form.next" class="input" type="password" placeholder="Nueva contrasena" />
          <input v-model="form.confirm" class="input" type="password" placeholder="Confirmar nueva contrasena" />
        </div>
        <p v-if="error" class="text-xs danger">{{ error }}</p>
        <p v-if="saved" class="text-xs success flex items-center gap-2"><CheckCircle2 class="w-4 h-4" /> Cambios guardados</p>
        <button class="primary-button justify-center py-3" @click="mode === 'password' ? savePassword() : saveProfile()"><Save class="w-4 h-4" /> Guardar cambios</button>
      </div>
    </div>
  </div>
</template>
