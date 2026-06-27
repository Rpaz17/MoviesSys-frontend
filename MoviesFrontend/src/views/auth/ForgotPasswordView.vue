<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AlertCircle, Film, Mail, XCircle } from "lucide-vue-next";
import { vEmail } from "../../lib/validation";
import { authService } from "../../services/auth.service";

const route = useRoute();
const router = useRouter();

const status = ref<"idle" | "loading" | "sent" | "error">("idle");
const form = reactive({ email: "" });
const error = ref("");

async function submit() {
  error.value = "";
  status.value = "idle";
  if (vEmail(form.email)) { error.value = "Ingresa un correo valido."; return; }
  status.value = "loading";
  try {
    await authService.forgotPassword({ email: form.email });
    status.value = "sent";
  } catch {
    status.value = "error";
    error.value = "No se pudo enviar el enlace. Verifica el correo.";
  }
}
</script>

<template>
  <div class="auth-shell">
    <div class="auth-bg-glow"></div>

    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">
          <Film class="w-6 h-6 text-white" />
        </div>
        <h1 class="auth-title">Recuperar cuenta</h1>
        <p class="auth-subtitle">MovieSys</p>
      </div>

      <div v-if="status === 'sent'" class="auth-alert auth-alert-success">
        <Mail class="w-4 h-4 flex-shrink-0" />
        <span>Enviamos instrucciones a tu correo.</span>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label class="auth-field">
          <span class="auth-label">Correo</span>
          <input v-model="form.email" class="input" placeholder="correo@moviesys.com" />
        </label>

        <div v-if="error" class="auth-alert auth-alert-error">
          <XCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ error }}</span>
        </div>

        <button class="primary-button auth-submit" :disabled="status === 'loading' || status === 'sent'">
          <AlertCircle class="w-4 h-4" />
          {{ status === 'loading' ? 'Enviando...' : 'Enviar enlace' }}
        </button>
      </form>

      <div class="auth-footer">
        <button class="auth-link" @click="router.push({ path: '/login', query: route.query })">Iniciar sesion</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 5.5rem 1.25rem 2rem;
  position: relative;
}
.auth-bg-glow {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200,16,46,0.06) 0%, transparent 70%);
}

.auth-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 400px;
  background: #1a1828;
  border: 1px solid rgba(200,169,110,0.1);
  border-radius: 5px;
  padding: 2rem 2rem 1.75rem;
  display: flex; flex-direction: column; gap: 1.5rem;
  box-shadow: 0 24px 80px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.2);
}

/* Logo block */
.auth-logo { display: flex; flex-direction: column; align-items: center; gap: .625rem; }
.auth-logo-icon {
  width: 2.75rem; height: 2.75rem;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #c8102e, #8c0a1f);
}
.auth-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.375rem; font-weight: 600;
  color: #f0ece4; margin: 0; text-align: center;
}
.auth-subtitle {
  font-family: 'DM Mono', monospace;
  font-size: .6875rem; letter-spacing: .1em; text-transform: uppercase;
  color: #c8a96e; margin: 0;
}

/* Alerts */
.auth-alert {
  display: flex; align-items: flex-start; gap: .625rem;
  border-radius: 3px; padding: .75rem .875rem;
  font-size: .8125rem; line-height: 1.45;
}
.auth-alert-success { background: rgba(76,175,125,0.07); border: 1px solid rgba(76,175,125,0.2); color: #4caf7d; }
.auth-alert-error { background: rgba(200,16,46,0.08); border: 1px solid rgba(200,16,46,0.22); color: #e8607a; }

/* Form */
.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.auth-field { display: flex; flex-direction: column; gap: .4375rem; }
.auth-label {
  font-size: .6875rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  font-family: 'DM Mono', monospace; color: #c8a96e;
}

.auth-submit {
  width: 100%; padding: .75rem 1rem;
  font-size: .875rem; margin-top: .25rem;
  justify-content: center;
}

/* Footer */
.auth-footer { display: flex; justify-content: center; gap: 1.25rem; padding-top: .25rem; }
.auth-link { font-size: .8125rem; color: #c8a96e; transition: opacity .12s; }
.auth-link:hover { opacity: .8; }
</style>
