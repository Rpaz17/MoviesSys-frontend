<script setup lang="ts">
import { computed } from "vue";
import { useCatalogHelpers } from "../composables/use-catalog-helpers";
import { useFormat } from "../composables/use-format";
import type { Reservation, Showtime } from "../types";

const props = defineProps<{ receipt: Reservation; showtime: Showtime | null; cashReceived: number }>();
const emit = defineEmits<{ close: [] }>();

const { movieFor, cinemaFor, roomFor } = useCatalogHelpers();
const { money, formatDate } = useFormat();

const sellMovie = computed(() => props.showtime ? movieFor(props.showtime.movieId) : undefined);
const sellCinema = computed(() => props.showtime ? cinemaFor(props.showtime.cinemaId) : undefined);
const sellRoom = computed(() => props.showtime ? roomFor(props.showtime.roomId) : undefined);
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <article class="modal-card receipt-modal">
      <span class="pill" style="background:rgba(76,175,125,0.12);border-color:rgba(76,175,125,0.3);color:#4caf7d">Pago exitoso</span>
      <h2>Recibo de venta</h2>
      <p class="receipt-id mono">#{{ receipt.id }}</p>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><span>Película</span><strong>{{ sellMovie?.title }}</strong></div>
      <div class="receipt-row"><span>Cine</span><strong>{{ sellCinema?.name }}</strong></div>
      <div class="receipt-row"><span>Sala</span><strong>{{ sellRoom?.name }} · {{ showtime?.format }}</strong></div>
      <div class="receipt-row"><span>Fecha</span><strong>{{ formatDate(receipt.date) }} · {{ receipt.time }}</strong></div>
      <div class="receipt-row"><span>Cliente</span><strong>{{ receipt.customerName }}</strong></div>
      <div class="receipt-row"><span>Asientos</span><strong>{{ receipt.seats.join(", ") }}</strong></div>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><span>Subtotal</span><strong>{{ money(receipt.total) }}</strong></div>
      <div class="receipt-row cash"><span>Efectivo</span><strong>{{ money(cashReceived) }}</strong></div>
      <div class="receipt-row change" v-if="cashReceived > receipt.total"><span>Cambio</span><strong>{{ money(cashReceived - receipt.total) }}</strong></div>
      <div class="receipt-divider"></div>
      <p class="receipt-footer mono muted">{{ new Date().toLocaleString("es-HN") }}</p>
      <button class="primary-button full" type="button" @click="emit('close')">Nueva venta</button>
    </article>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.65); z-index: 30; backdrop-filter: blur(4px); }
.modal-card { width: min(480px, calc(100vw - 2rem)); background: #171526; border: 1px solid rgba(200,169,110,0.14); border-radius: 4px; padding: 1.5rem; display: grid; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); }
.receipt-modal { gap: 10px; }
.receipt-id { font-size: 1.25rem; color: #c8a96e; letter-spacing: .04em; }
.receipt-divider { height: 1px; background: rgba(200,169,110,0.1); margin: 4px 0; }
.receipt-row { display: flex; justify-content: space-between; gap: 12px; font-size: .875rem; }
.receipt-row span { color: #7a7590; }
.receipt-row strong { color: #f0ece4; text-align: right; }
.receipt-row.cash strong { color: #6495ed; }
.receipt-row.change strong { color: #4caf7d; }
.receipt-footer { font-size: .6875rem; text-align: center; letter-spacing: .04em; }
.primary-button { display: inline-flex; align-items: center; justify-content: center; gap: .375rem; border-radius: 3px; padding: .5rem 1.125rem; font-size: .8125rem; font-weight: 600; letter-spacing: .01em; color: #f0ece4; background: linear-gradient(135deg, #c8102e, #8c0a1f); border: 1px solid rgba(200,16,46,0.4); transition: opacity .15s, transform .1s; }
.primary-button:hover { opacity: .9; }
.primary-button:active { transform: scale(.98); }
.full { width: 100%; }
</style>
