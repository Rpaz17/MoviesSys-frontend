<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Configuración de cancelación</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <form class="card form-card" @submit.prevent="savePolicy">
        <div class="form-grid">
          <label class="field">Reembolso completo antes de (horas)<input v-model.number="policy.fullHours" class="input" type="number" /></label>
          <label class="field">Reembolso parcial antes de (horas)<input v-model.number="policy.partialHours" class="input" type="number" /></label>
          <label class="field">Porcentaje parcial (%)<input v-model.number="policy.partialPercent" class="input" type="number" /></label>
        </div>
        <p class="policy-box">Esta configuración alimenta la política mostrada al cliente antes de cancelar una reserva.</p>
        <button class="primary-button" type="submit">Guardar política</button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";

const router = useRouter();

const policy = reactive({ fullHours: 24, partialHours: 6, partialPercent: 50 });

function savePolicy() {
  // Policy saved to reactive state — can be extended to persist
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.form-card { padding: 1.5rem; display: grid; gap: 1.125rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.policy-box { border-radius: 3px; padding: .875rem; background: rgba(255,255,255,0.04); color: #7a7590; font-size: .8125rem; line-height: 1.5; }
@media (max-width: 900px) {
  .section-header { align-items: stretch; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>
