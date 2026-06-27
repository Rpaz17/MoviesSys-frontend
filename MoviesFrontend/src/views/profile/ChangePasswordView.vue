<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { CheckCircle2, KeyRound, Save, XCircle } from "lucide-vue-next";
import { vPass, vConfirm } from "../../lib/validation";
import { useSessionStore } from "../../stores/session";

const router = useRouter();
const session = useSessionStore();
const saved = ref(false);
const error = ref("");
const loading = ref(false);

const form = reactive({
  current: "",
  next: "",
  confirm: "",
});

async function savePassword() {
  error.value = "";
  if (!form.current) {
    error.value = "Ingresa tu contrasena actual.";
    return;
  }
  const validation = vPass(form.next) || vConfirm(form.next, form.confirm);
  if (validation) {
    error.value = validation;
    return;
  }
  loading.value = true;
  const ok = await session.changePassword(form.current, form.next);
  loading.value = false;
  if (ok) {
    saved.value = true;
  } else {
    error.value = "No se pudo cambiar la contrasena. Verifica tu contrasena actual.";
  }
}
</script>

<template>
  <div class="page">
    <div class="max-w-2xl mx-auto flex flex-col gap-5">
      <button class="text-xs muted text-left" @click="router.push('/home')">Inicio / Cambiar contrasena</button>
      <div class="card p-6 flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded flex items-center justify-center" style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.18)">
            <KeyRound class="w-4 h-4 accent" />
          </div>
          <div>
            <h1 class="text-xl font-semibold" style="font-family:'Playfair Display',serif;color:#f0ece4;letter-spacing:-.01em">Cambiar contrasena</h1>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-4">
          <input v-model="form.current" class="input" type="password" placeholder="Contrasena actual" />
          <input v-model="form.next" class="input" type="password" placeholder="Nueva contrasena" />
          <input v-model="form.confirm" class="input" type="password" placeholder="Confirmar nueva contrasena" />
        </div>
        <p v-if="error" class="text-xs danger flex items-center gap-2"><XCircle class="w-4 h-4" /> {{ error }}</p>
        <p v-if="saved" class="text-xs success flex items-center gap-2"><CheckCircle2 class="w-4 h-4" /> Contrasena actualizada correctamente</p>
        <button class="primary-button justify-center py-3" :disabled="loading" @click="savePassword"><Save class="w-4 h-4" /> {{ loading ? 'Guardando...' : 'Guardar cambios' }}</button>
      </div>
    </div>
  </div>
</template>
