<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Film, Loader2, Mail, XCircle } from "lucide-vue-next";
import { useSessionStore } from "../stores/session";
import { vConfirm, vEmail, vName, vPass, vPassLogin, strength } from "../lib/validation";

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const mode = computed(() => String(route.meta.mode ?? "login"));
const show = ref(false);
const status = ref<"idle" | "loading" | "success" | "error" | "sent">("idle");
const form = reactive({ name: "", email: "", password: "", confirm: "" });
const error = ref("");
const passStrength = computed(() => strength(form.password));
const redirectTo = computed(() => String(route.query.redirect || "/home"));
const loginReason = computed(() => route.query.reason === "checkout");

function finishAuth() {
  router.push(redirectTo.value);
}

function submit() {
  error.value = "";
  if (mode.value === "login") {
    if (vEmail(form.email) || vPassLogin(form.password)) {
      error.value = "Revisa correo y contrasena.";
      return;
    }
    status.value = "loading";
    window.setTimeout(() => {
      const ok = session.login(form.email, form.password);
      status.value = ok ? "success" : "error";
      if (ok) finishAuth();
      else error.value = "Credenciales invalidas.";
    }, 350);
    return;
  }
  if (mode.value === "register") {
    const validation = vName(form.name) || vEmail(form.email) || vPass(form.password) || vConfirm(form.password, form.confirm);
    if (validation) { error.value = validation; return; }
    session.register(form.name, form.email);
    status.value = "success";
    finishAuth();
    return;
  }
  if (mode.value === "forgot") {
    if (vEmail(form.email)) { error.value = "Ingresa un correo valido."; return; }
    status.value = "sent";
    return;
  }
  const validation = vPass(form.password) || vConfirm(form.password, form.confirm);
  if (validation) { error.value = validation; return; }
  status.value = "success";
}
</script>

<template>
  <div class="auth-shell">
    <!-- Subtle bg gradient -->
    <div class="auth-bg-glow"></div>

    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">
        <div class="auth-logo-icon">
          <Film class="w-6 h-6 text-white" />
        </div>
        <h1 class="auth-title">
          {{ mode === 'login' ? 'Iniciar sesion' : mode === 'register' ? 'Crear cuenta' : mode === 'forgot' ? 'Recuperar cuenta' : 'Nueva contrasena' }}
        </h1>
        <p class="auth-subtitle">MovieSys</p>
      </div>

      <div v-if="loginReason" class="auth-alert auth-alert-info">
        <AlertCircle class="w-4 h-4 flex-shrink-0" />
        <span>Para reservar y pagar necesitas iniciar sesion o crear una cuenta.</span>
      </div>

      <!-- Alerts -->
      <div v-if="status === 'success' && mode !== 'login'" class="auth-alert auth-alert-success">
        <CheckCircle2 class="w-4 h-4 flex-shrink-0" />
        <span>{{ mode === 'register' ? 'Cuenta creada correctamente.' : 'Contrasena actualizada.' }}</span>
      </div>
      <div v-if="status === 'sent'" class="auth-alert auth-alert-success">
        <Mail class="w-4 h-4 flex-shrink-0" />
        <span>Enviamos instrucciones a tu correo.</span>
      </div>

      <!-- Form -->
      <form class="auth-form" @submit.prevent="submit">
        <label v-if="mode === 'register'" class="auth-field">
          <span class="auth-label">Nombre</span>
          <input v-model="form.name" class="input" placeholder="Valeria Montoya" />
        </label>
        <label v-if="mode !== 'reset'" class="auth-field">
          <span class="auth-label">Correo</span>
          <input v-model="form.email" class="input" placeholder="correo@moviesys.com" />
        </label>
        <label v-if="mode !== 'forgot'" class="auth-field">
          <span class="auth-label">Contrasena</span>
          <div class="auth-pass-wrap">
            <input v-model="form.password" class="input" :type="show ? 'text' : 'password'" placeholder="••••••••" style="padding-right:2.75rem" />
            <button type="button" class="auth-eye" @click="show = !show">
              <EyeOff v-if="show" class="w-4 h-4" /><Eye v-else class="w-4 h-4" />
            </button>
          </div>
          <p v-if="form.password && mode !== 'login'" class="auth-strength" :style="{ color: passStrength.color }">{{ passStrength.label }}</p>
        </label>
        <label v-if="mode === 'register' || mode === 'reset'" class="auth-field">
          <span class="auth-label">Confirmar</span>
          <input v-model="form.confirm" class="input" type="password" placeholder="••••••••" />
        </label>

        <div v-if="error" class="auth-alert auth-alert-error">
          <XCircle class="w-4 h-4 flex-shrink-0" />
          <span>{{ error }}</span>
        </div>

        <button class="primary-button auth-submit" :disabled="status === 'loading'">
          <Loader2 v-if="status === 'loading'" class="w-4 h-4 animate-spin" />
          <AlertCircle v-else-if="mode === 'forgot'" class="w-4 h-4" />
          <ArrowRight v-else class="w-4 h-4" />
          {{ mode === 'login' ? 'Entrar' : mode === 'register' ? 'Registrarme' : mode === 'forgot' ? 'Enviar enlace' : 'Actualizar' }}
        </button>
      </form>

      <!-- Footer links -->
      <div class="auth-footer">
        <button v-if="mode !== 'login'" class="auth-link" @click="router.push({ path: '/login', query: route.query })">Iniciar sesion</button>
        <button v-if="mode === 'login'" class="auth-link" @click="router.push({ path: '/register', query: route.query })">Crear cuenta</button>
        <button v-if="mode === 'login'" class="auth-link auth-link-muted" @click="router.push('/forgot')">Olvide mi contrasena</button>
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
.auth-alert-info { background: rgba(200,169,110,0.07); border: 1px solid rgba(200,169,110,0.22); color: #c8a96e; }

/* Form */
.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.auth-field { display: flex; flex-direction: column; gap: .4375rem; }
.auth-label {
  font-size: .6875rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase;
  font-family: 'DM Mono', monospace; color: #c8a96e;
}
.auth-pass-wrap { position: relative; }
.auth-eye {
  position: absolute; right: .75rem; top: 50%; transform: translateY(-50%);
  color: #7a7590; transition: color .12s;
}
.auth-eye:hover { color: #c8a96e; }
.auth-strength { font-size: .6875rem; margin-top: .25rem; font-family: 'DM Mono', monospace; }

.auth-submit {
  width: 100%; padding: .75rem 1rem;
  font-size: .875rem; margin-top: .25rem;
  justify-content: center;
}

/* Footer */
.auth-footer { display: flex; justify-content: center; gap: 1.25rem; padding-top: .25rem; }
.auth-link { font-size: .8125rem; color: #c8a96e; transition: opacity .12s; }
.auth-link:hover { opacity: .8; }
.auth-link-muted { color: #7a7590; }
.auth-link-muted:hover { color: #a09aae; opacity: 1; }
</style>
