<script setup lang="ts">
import { computed } from "vue";
import { useCatalogHelpers } from "../composables/use-catalog-helpers";
import { useFormat } from "../composables/use-format";
import type { Reservation } from "../types";

const props = defineProps<{ reservation: Reservation }>();
const emit = defineEmits<{ close: [] }>();

const { movieFor, cinemaFor, roomFor } = useCatalogHelpers();
const { money, formatDate } = useFormat();

const detailMovie = computed(() => movieFor(props.reservation.movieId));
const detailCinema = computed(() => cinemaFor(props.reservation.cinemaId));
const detailRoom = computed(() => roomFor(props.reservation.roomId));

const detailStatusClass = computed(() => {
  if (props.reservation.status === "cancelada") return "status-canceled";
  return props.reservation.paymentStatus === "pagado" ? "status-paid" : "status-pending";
});

const detailStatusLabel = computed(() => {
  if (props.reservation.status === "cancelada") return "Cancelada";
  return props.reservation.paymentStatus === "pagado" ? "Pagado" : "Pendiente";
});
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <article class="modal-card detail-modal">
      <span class="pill" :class="detailStatusClass">{{ detailStatusLabel }}</span>
      <h2>{{ detailMovie?.title }}</h2>
      <p class="detail-id mono muted">Reserva #{{ reservation.id }}</p>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><span>Cliente</span><strong>{{ reservation.customerName }}</strong></div>
      <div class="receipt-row"><span>Correo</span><strong style="font-size:.8125rem">{{ reservation.customerEmail }}</strong></div>
      <div class="receipt-row"><span>Cine</span><strong>{{ detailCinema?.name }}</strong></div>
      <div class="receipt-row"><span>Sala</span><strong>{{ detailRoom?.name }} · {{ detailRoom?.type }}</strong></div>
      <div class="receipt-row"><span>Fecha</span><strong>{{ formatDate(reservation.date) }} · {{ reservation.time }}</strong></div>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><span>Asientos</span><strong>{{ reservation.seats.join(", ") }}</strong></div>
      <div class="receipt-divider"></div>
      <div class="receipt-row"><span>Subtotal</span><strong>{{ money(reservation.total + (reservation.discount ?? 0)) }}</strong></div>
      <div class="receipt-row" v-if="reservation.discount"><span>Descuento{{ reservation.couponCode ? ` (${reservation.couponCode})` : '' }}</span><strong>-{{ money(reservation.discount) }}</strong></div>
      <div class="receipt-row total"><span>Total</span><strong>{{ money(reservation.total) }}</strong></div>
      <div class="receipt-row"><span>Método</span><strong>{{ reservation.paymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta' }}</strong></div>
      <div class="receipt-row" v-if="reservation.transactionId"><span>Transacción</span><strong class="mono" style="font-size:.75rem">{{ reservation.transactionId }}</strong></div>
      <template v-if="reservation.status === 'cancelada'">
        <div class="receipt-divider"></div>
        <div class="receipt-row"><span>Estado reembolso</span><strong>{{ reservation.refundStatus ?? '-' }}</strong></div>
        <div class="receipt-row" v-if="reservation.refundAmount"><span>Monto reembolso</span><strong>{{ money(reservation.refundAmount) }}</strong></div>
      </template>
      <button class="primary-button full" type="button" @click="emit('close')">Cerrar</button>
    </article>
  </div>
</template>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.65); z-index: 30; backdrop-filter: blur(4px); }
.modal-card { width: min(660px, calc(100vw - 2rem)); background: #171526; border: 1px solid rgba(200,169,110,0.14); border-radius: 4px; padding: 1.5rem; display: grid; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); }
.detail-modal { gap: 12px; }
.detail-id { font-size: .8125rem; letter-spacing: .04em; margin: 0; }
.receipt-divider { height: 1px; background: rgba(200,169,110,0.1); margin: 4px 0; }
.receipt-row { display: flex; justify-content: space-between; gap: 12px; font-size: .875rem; }
.receipt-row span { color: #7a7590; }
.receipt-row strong { color: #f0ece4; text-align: right; }
.receipt-row.total strong { font-size: 1.0625rem; }
.status-paid { background: rgba(76,175,125,0.12) !important; border-color: rgba(76,175,125,0.3) !important; color: #4caf7d !important; }
.status-pending { background: rgba(200,169,110,0.12) !important; border-color: rgba(200,169,110,0.3) !important; color: #c8a96e !important; }
.status-canceled { background: rgba(232,96,122,0.12) !important; border-color: rgba(232,96,122,0.3) !important; color: #e8607a !important; }
</style>
