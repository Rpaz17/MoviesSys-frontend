<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { CheckCircle2, CreditCard, Save } from "lucide-vue-next";
import { useSessionStore } from "../../stores/session";
import { digitsOnly, formatCardNumber, formatExpiry, validateCard } from "../../utils/card-validation";

const router = useRouter();
const session = useSessionStore();
const saved = ref(false);
const error = ref("");

const form = reactive({
  cardName: session.user?.name ?? "",
  cardNumber: "",
  cardExpiry: "",
  cardCvv: "",
});

function savePaymentMethod() {
  if (!form.cardName || !form.cardNumber || !form.cardExpiry || !form.cardCvv) {
    error.value = "Completa los datos de la tarjeta.";
    return;
  }
  const validationError = validateCard(form.cardNumber, form.cardExpiry, form.cardCvv);
  if (validationError) {
    error.value = validationError;
    saved.value = false;
    return;
  }
  error.value = "";
  saved.value = true;
}

function onCardNumberInput(event: Event) {
  form.cardNumber = formatCardNumber((event.target as HTMLInputElement).value);
}

function onExpiryInput(event: Event) {
  form.cardExpiry = formatExpiry((event.target as HTMLInputElement).value);
}

function onCvcInput(event: Event) {
  form.cardCvv = digitsOnly((event.target as HTMLInputElement).value).slice(0, 4);
}
</script>

<template>
  <div class="page">
    <div class="max-w-2xl mx-auto flex flex-col gap-5">
      <button class="text-xs muted text-left" @click="router.push('/home')">Inicio / Metodos de pago</button>
      <div class="card p-6 flex flex-col gap-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded flex items-center justify-center" style="background:rgba(200,169,110,.08);border:1px solid rgba(200,169,110,.18)">
            <CreditCard class="w-4 h-4 accent" />
          </div>
          <div>
            <h1 class="text-xl font-semibold" style="font-family:'Playfair Display',serif;color:#f0ece4;letter-spacing:-.01em">Metodos de pago</h1>
            <p class="text-xs muted">{{ session.user?.email }}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input v-model="form.cardName" class="input md:col-span-2" placeholder="Nombre en tarjeta" />
          <input :value="form.cardNumber" class="input md:col-span-2" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="Numero de tarjeta" @input="onCardNumberInput" />
          <input :value="form.cardExpiry" class="input" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="MM/AA" @input="onExpiryInput" />
          <input :value="form.cardCvv" class="input" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="CVC" @input="onCvcInput" />
          <div class="card-preview md:col-span-2">
            <span>Tarjeta principal</span>
            <strong>{{ form.cardNumber ? `**** **** **** ${form.cardNumber.slice(-4)}` : "Sin tarjeta guardada" }}</strong>
          </div>
        </div>
        <p v-if="error" class="text-xs danger">{{ error }}</p>
        <p v-if="saved" class="text-xs success flex items-center gap-2"><CheckCircle2 class="w-4 h-4" /> Cambios guardados</p>
        <button class="primary-button justify-center py-3" @click="savePaymentMethod"><Save class="w-4 h-4" /> Guardar cambios</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
