<script setup lang="ts">
import { computed } from "vue";
import { useFormat } from "../composables/use-format";
import type { Reservation } from "../types";

const props = defineProps<{ reservation: Reservation }>();
const emit = defineEmits<{ close: []; confirm: [] }>();

const { money } = useFormat();

function calculateRefund(reservation: Reservation) {
  const showDate = new Date(`${reservation.date}T${reservation.time}:00`);
  const hours = (showDate.getTime() - Date.now()) / 36e5;
  if (hours > 24) return reservation.total;
  if (hours > 6) return reservation.total * 0.5;
  return 0;
}

const refundEstimate = computed(() => calculateRefund(props.reservation));
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <article class="modal-card">
      <h2>Confirmar cancelación</h2>
      <p>Política: reembolso completo con más de 24 horas de anticipación, 50% entre 6 y 24 horas, sin reembolso en las últimas 6 horas.</p>
      <div class="summary-line total"><span>Reembolso estimado</span><strong>{{ money(refundEstimate) }}</strong></div>
      <div class="modal-actions">
        <button class="ghost-button" type="button" @click="emit('close')">Volver</button>
        <button class="danger-button" type="button" @click="emit('confirm')">Cancelar reserva</button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.65); z-index: 30; backdrop-filter: blur(4px); }
.modal-card { width: min(480px, calc(100vw - 2rem)); background: #171526; border: 1px solid rgba(200,169,110,0.14); border-radius: 4px; padding: 1.5rem; display: grid; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.summary-line { display: flex; justify-content: space-between; gap: 14px; align-items: center; font-size: .875rem; }
.summary-line.total { font-size: 1.0625rem; font-weight: 600; padding-top: 10px; border-top: 1px solid rgba(200,169,110,0.12); }
.summary-line strong { text-align: right; color: #f0ece4; }
.danger-button { border-radius: 3px; padding: .4375rem .875rem; font-size: .8125rem; font-weight: 500; color: #ffd8df; border: 1px solid rgba(232,96,122,.3); background: rgba(232,96,122,.08); transition: background .12s; }
.danger-button:hover { background: rgba(232,96,122,.15); }
.ghost-button { display: inline-flex; align-items: center; justify-content: center; gap: .375rem; border-radius: 3px; padding: .5rem 1rem; font-size: .8125rem; font-weight: 500; color: #c8a96e; border: 1px solid rgba(200,169,110,0.22); background: rgba(200,169,110,0.05); transition: background .15s, border-color .15s; }
.ghost-button:hover { background: rgba(200,169,110,0.1); border-color: rgba(200,169,110,0.35); }
</style>
