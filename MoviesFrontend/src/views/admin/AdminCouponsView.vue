<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Cupones</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <div class="admin-split">
        <form class="card form-card" @submit.prevent="saveCoupon">
          <div class="form-grid">
            <label class="field">Código<input v-model.trim="couponForm.code" class="input" required /></label>
            <label class="field">Tipo<select v-model="couponForm.type" class="input"><option value="porcentaje">Porcentaje</option><option value="monto">Monto fijo</option></select></label>
            <label class="field">Valor<input v-model.number="couponForm.value" class="input" type="number" min="1" required /></label>
            <label class="field">Expiración<input v-model="couponForm.expiresAt" class="input" type="date" required /></label>
            <label class="field">Usos máximos<input v-model.number="couponForm.maxUses" class="input" type="number" min="0" /></label>
          </div>
          <button class="primary-button" type="submit">Crear cupón</button>
        </form>
        <div class="stack">
          <article v-for="coupon in coupons" :key="coupon.id" class="card list-row">
            <div>
              <h2>{{ coupon.code }}</h2>
              <p>{{ coupon.type }} · {{ coupon.value }} · vence {{ coupon.expiresAt }} · {{ coupon.uses }} usos</p>
            </div>
            <button class="ghost-button" type="button" @click="reservationsStore.toggleCoupon(coupon.id)">{{ coupon.active ? "Desactivar" : "Activar" }}</button>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useReservationsStore } from "../../stores/reservations";
import { storeToRefs } from "pinia";
import type { Coupon } from "../../types";

const router = useRouter();
const reservationsStore = useReservationsStore();
const { coupons } = storeToRefs(reservationsStore);

const couponForm = reactive<Omit<Coupon, "id" | "active" | "uses"> & { maxUses: number }>({
  code: "",
  type: "porcentaje",
  value: 10,
  expiresAt: "2026-12-31",
  maxUses: 0,
});

function saveCoupon() {
  reservationsStore.addCoupon({
    ...couponForm,
    id: `CP${String(coupons.value.length + 1).padStart(3, "0")}`,
    code: couponForm.code.toUpperCase(),
    active: true,
    uses: 0,
  });
  couponForm.code = "";
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { font-size: .9375rem; font-weight: 600; color: #f0ece4; margin: 0; }
p, span { color: #7a7590; font-size: .875rem; margin: 0; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.form-card { padding: 1.5rem; display: grid; gap: 1.125rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.admin-split { display: grid; grid-template-columns: minmax(300px, 440px) 1fr; gap: 16px; align-items: start; }
.stack { display: grid; gap: 10px; }
.list-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 1rem 1.125rem; }
@media (max-width: 900px) {
  .section-header, .list-row { align-items: stretch; flex-direction: column; }
  .admin-split, .form-grid { grid-template-columns: 1fr; }
}
</style>
