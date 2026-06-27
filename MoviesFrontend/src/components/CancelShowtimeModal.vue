<script setup lang="ts">
import { useCatalogHelpers } from "../composables/use-catalog-helpers";
import type { Showtime } from "../types";

defineProps<{ showtime: Showtime }>();
const emit = defineEmits<{ close: []; confirm: [] }>();

const { movieFor, cinemaFor, roomFor } = useCatalogHelpers();
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <article class="modal-card">
      <h2>Cancelar función</h2>
      <p><strong>{{ movieFor(showtime.movieId)?.title }}</strong></p>
      <p>{{ cinemaFor(showtime.cinemaId)?.name }} · {{ roomFor(showtime.roomId)?.name }}</p>
      <p>{{ showtime.date }} · {{ showtime.time }} · {{ showtime.format }}</p>
      <p class="policy-box">Al cancelar esta función pasará a estado <strong>inactivo</strong>. Las reservas existentes no se eliminarán, pero la función ya no aparecerá disponible para nuevas reservas.</p>
      <div class="modal-actions">
        <button class="ghost-button" type="button" @click="emit('close')">Volver</button>
        <button class="danger-button" type="button" @click="emit('confirm')">Confirmar cancelación</button>
      </div>
    </article>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.65); z-index: 30; backdrop-filter: blur(4px); }
.modal-card { width: min(480px, calc(100vw - 2rem)); background: #171526; border: 1px solid rgba(200,169,110,0.14); border-radius: 4px; padding: 1.5rem; display: grid; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.policy-box { border-radius: 3px; padding: .875rem; background: rgba(255,255,255,0.04); color: #7a7590; font-size: .8125rem; line-height: 1.5; }
.ghost-button { display: inline-flex; align-items: center; justify-content: center; gap: .375rem; border-radius: 3px; padding: .5rem 1rem; font-size: .8125rem; font-weight: 500; color: #c8a96e; border: 1px solid rgba(200,169,110,0.22); background: rgba(200,169,110,0.05); transition: background .15s, border-color .15s; }
.ghost-button:hover { background: rgba(200,169,110,0.1); border-color: rgba(200,169,110,0.35); }
.danger-button { border-radius: 3px; padding: .4375rem .875rem; font-size: .8125rem; font-weight: 500; color: #ffd8df; border: 1px solid rgba(232,96,122,.3); background: rgba(232,96,122,.08); transition: background .12s; }
.danger-button:hover { background: rgba(232,96,122,.15); }
</style>
