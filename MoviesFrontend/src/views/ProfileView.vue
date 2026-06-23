<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CheckCircle2, CreditCard, KeyRound, Save, User } from "lucide-vue-next";
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
  notifications: true,
  cardName: session.user?.name ?? "",
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
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

function savePaymentMethod() {
  if (!form.cardName || !form.cardNumber || !form.cardExpiry || !form.cardCvv) {
    error.value = "Completa los datos de la tarjeta.";
    return;
  }
  error.value = "";
  saved.value = true;
}
</script>

<template>
  <div class="page">
    <div class="max-w-2xl mx-auto flex flex-col gap-5">
      <button class="text-xs muted text-left" @click="router.push('/home')">Inicio / {{ mode === 'password' ? 'Cambiar contrasena' : mode === 'payments' ? 'Metodos de pago' : 'Perfil' }}</button>
      <div class="card p-6 flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded flex items-center justify-center" style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.18)">
            <KeyRound v-if="mode === 'password'" class="w-4 h-4 accent" />
            <CreditCard v-else-if="mode === 'payments'" class="w-4 h-4 accent" />
            <User v-else class="w-4 h-4 accent" />
          </div>
          <div>
            <h1 class="text-xl font-semibold" style="font-family:'Playfair Display',serif;color:#f0ece4;letter-spacing:-.01em">{{ mode === 'password' ? 'Cambiar contrasena' : mode === 'payments' ? 'Metodos de pago' : 'Mi perfil' }}</h1>
            <p class="text-xs muted">{{ session.user?.email }}</p>
          </div>
        </div>
        <div v-if="mode === 'profile'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div v-else-if="mode === 'payments'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input v-model="form.cardName" class="input md:col-span-2" placeholder="Nombre en tarjeta" />
          <input v-model="form.cardNumber" class="input md:col-span-2" inputmode="numeric" placeholder="Numero de tarjeta" />
          <input v-model="form.cardExpiry" class="input" placeholder="MM/AA" />
          <input v-model="form.cardCvv" class="input" inputmode="numeric" placeholder="CVV" />
          <div class="card-preview md:col-span-2">
            <span>Tarjeta principal</span>
            <strong>{{ form.cardNumber ? `**** **** **** ${form.cardNumber.slice(-4)}` : "Sin tarjeta guardada" }}</strong>
          </div>
        </div>
        <div v-else class="grid grid-cols-1 gap-4">
          <input v-model="form.current" class="input" type="password" placeholder="Contrasena actual" />
          <input v-model="form.next" class="input" type="password" placeholder="Nueva contrasena" />
          <input v-model="form.confirm" class="input" type="password" placeholder="Confirmar nueva contrasena" />
        </div>
        <p v-if="error" class="text-xs danger">{{ error }}</p>
        <p v-if="saved" class="text-xs success flex items-center gap-2"><CheckCircle2 class="w-4 h-4" /> Cambios guardados</p>
        <button class="primary-button justify-center py-3" @click="mode === 'password' ? savePassword() : mode === 'payments' ? savePaymentMethod() : saveProfile()"><Save class="w-4 h-4" /> Guardar cambios</button>
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
.card-preview {
  display: grid;
  gap: .35rem;
  border: 1px solid rgba(200,169,110,.14);
  border-radius: 3px;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(200,169,110,.12), rgba(200,16,46,.08));
}
.card-preview span {
  color: #c8a96e;
  font-family: "DM Mono", monospace;
  font-size: .6875rem;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.card-preview strong {
  color: #f0ece4;
  font-size: 1rem;
}
</style>
