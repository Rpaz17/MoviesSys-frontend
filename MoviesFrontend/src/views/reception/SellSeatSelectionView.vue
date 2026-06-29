<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Recepcion</p>
        <h1>Vender boletos</h1>
      </div>
      <button class="ghost-button" type="button" @click="router.push('/recepcion/vender')">Volver a funciones</button>
    </div>

    <div v-if="isLoading" class="empty-state card">Cargando asientos...</div>

    <div v-else-if="sellShowtime" class="booking-grid">
      <article class="card seat-card">
        <div class="screen">Pantalla</div>
        <div class="seat-scroll" aria-label="Mapa de asientos">
          <div class="seat-map" :style="{ gridTemplateColumns: `repeat(${sellRoom?.cols ?? 10}, 48px)` }">
            <button
              v-for="seat in sellSeatList"
              :key="seat"
              type="button"
              class="seat"
              :class="{
                reserved: isReserved(seat),
                selected: sellSeats.includes(seat),
                'own-blocked': isOwnBlocked(seat),
                'blocked-other': isBlockedByOther(seat),
              }"
              :disabled="isReserved(seat) || isBlockedByOther(seat)"
              @click="toggleSellSeat(seat)"
            >
              {{ seat }}
            </button>
          </div>
        </div>
        <div class="legend">
          <span><i class="seat-dot available"></i>Disponible</span>
          <span><i class="seat-dot selected-dot"></i>Seleccionado</span>
          <span><i class="seat-dot own-blocked-dot"></i>Bloqueado por ti</span>
          <span><i class="seat-dot reserved-dot"></i>No disponible</span>
          <span v-if="sellingError" class="error-msg legend-error">{{ sellingError }}</span>
        </div>
      </article>

      <aside class="card checkout-card">
        <h2>{{ sellMovie?.title }}</h2>
        <p>{{ sellCinema?.name }} · {{ sellRoom?.name }}</p>
        <p>{{ sellShowtime.date }} · {{ sellShowtime.time }}</p>
        <div class="summary-line"><span>Asientos</span><strong class="selected-seat-list">{{ sellSeats.join(", ") || "Sin seleccionar" }}</strong></div>
        <div class="summary-line total"><span>Total</span><strong>{{ money(sellTotal) }}</strong></div>

        <label class="field">
          Nombre del cliente
          <input v-model="sellCustomerName" class="input" placeholder="Nombre completo" />
        </label>

        <label class="field">
          Metodo de pago
          <select v-model="paymentMethod" class="input">
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </label>

        <template v-if="paymentMethod === 'tarjeta'">
          <div class="payment-grid">
            <input v-model="cardNumber" class="input" placeholder="Numero de tarjeta" />
            <input v-model="cardExpiry" class="input" placeholder="MM/AA" />
            <input v-model="cardCvv" class="input" placeholder="CVV" />
          </div>
        </template>

        <template v-else>
          <div class="pos-cash-row">
            <label class="field" style="flex:1">
              Efectivo recibido
              <input v-model.number="cashReceived" class="input" type="number" min="0" step="0.01" placeholder="0.00" />
            </label>
            <div class="pos-change" v-if="cashReceived >= sellTotal">
              <span class="mono muted" style="font-size:.6875rem;text-transform:uppercase">Cambio</span>
              <strong>{{ money(cashReceived - sellTotal) }}</strong>
            </div>
          </div>
        </template>

        <p v-if="sellError" class="error-msg">{{ sellError }}</p>

        <button class="primary-button full" type="button" :disabled="!canSell || isConfirming" @click="confirmSell">
          {{ isConfirming ? 'Procesando...' : 'Cobrar y emitir boleto' }}
        </button>
        <button class="ghost-button full" type="button" @click="router.push('/recepcion/vender')">Cancelar venta</button>
      </aside>
    </div>

    <div v-else class="empty-state card">Funcion no encontrada.</div>

    <SellReceiptModal
      v-if="sellReceipt"
      :receipt="sellReceipt"
      :showtime="sellShowtime"
      :cash-received="paymentMethod === 'efectivo' ? cashReceived : 0"
      :payment-method="paymentMethod"
      @close="closeSellReceipt"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCatalogStore } from "../../stores/catalog";
import { useReservationsStore } from "../../stores/reservations";
import { useSessionStore } from "../../stores/session";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import { useFunciones } from "../../composables/use-funciones";
import { reservasService } from "../../services/reservas.service";
import type { Asiento } from "../../services/funciones.service";
import SellReceiptModal from "../../components/SellReceiptModal.vue";
import type { Reservation, Showtime } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const session = useSessionStore();
const { reservations } = storeToRefs(reservationsStore);
const { movieFor, cinemaFor, roomFor, priceFor } = useCatalogHelpers();
const { money } = useFormat();
const {
  asientos,
  fetchAsientos,
  bloquearAsiento: bloquear,
  liberarAsiento: liberar,
  isPending,
} = useFunciones();

const showtimeId = computed(() => String(route.params.showtimeId));
const isLoading = ref(false);

const currentUserId = computed(() => session.user?.id ?? "");

let refreshTimer: number | undefined;

onMounted(async () => {
  isLoading.value = true;
  console.log("[SellSeatSelectionView] mounted, showtimeId:", showtimeId.value);

  if (catalog.showtimes.length === 0 || catalog.movies.length === 0) {
    await catalog.loadAllShowtimes();
    console.log("[SellSeatSelectionView] post loadAllShowtimes, showtimes:", catalog.showtimes.length);
  }

  await reservationsStore.loadFromAPI();
  console.log("[SellSeatSelectionView] reservations loaded:", reservations.value.length);

  await fetchAsientos(showtimeId.value);
  console.log("[SellSeatSelectionView] asientos from API:", asientos.value.length);

  isLoading.value = false;

  refreshTimer = window.setInterval(async () => {
    await fetchAsientos(showtimeId.value);
  }, 13000);
});

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer);
});

const sellShowtime = computed<Showtime | null>(() =>
  catalog.showtimes.find((s) => s.id === showtimeId.value) ?? null
);

const sellSeats = ref<string[]>([]);
const sellCustomerName = ref("");
const cashReceived = ref(0);
const sellReceipt = ref<Reservation | null>(null);
const paymentMethod = ref<"efectivo" | "tarjeta">("efectivo");
const cardNumber = ref("");
const cardExpiry = ref("");
const cardCvv = ref("");
const isConfirming = ref(false);
const sellError = ref("");
const sellingError = ref("");

const sellMovie = computed(() => (sellShowtime.value ? movieFor(sellShowtime.value.movieId) : undefined));
const sellCinema = computed(() => (sellShowtime.value ? cinemaFor(sellShowtime.value.cinemaId) : undefined));
const sellRoom = computed(() => (sellShowtime.value ? roomFor(sellShowtime.value.roomId) : undefined));

const sellSeatList = computed(() => {
  const room = sellRoom.value;
  if (!room) return [];
  if (asientos.value.length > 0) {
    return asientos.value.map((a) =>
      `${String.fromCharCode(64 + (a.fila ?? 0))}${a.columna ?? 0}`
    );
  }
  return Array.from({ length: room.rows * room.cols }, (_, index) =>
    `${String.fromCharCode(65 + Math.floor(index / room.cols))}${(index % room.cols) + 1}`
  );
});

function findAsientoByLabel(label: string): Asiento | undefined {
  return asientos.value.find((a) =>
    `${String.fromCharCode(64 + (a.fila ?? 0))}${a.columna ?? 0}` === label
  );
}

function normalizeEstado(estado: string): string {
  const e = estado.toLowerCase();
  if (e === "blocked" || e === "bloqueado") return "bloqueado";
  if (e === "reserved" || e === "reservado" || e === "occupied" || e === "ocupado") return "reservado";
  if (e === "available" || e === "disponible") return "disponible";
  return estado;
}

function isReserved(label: string): boolean {
  const a = findAsientoByLabel(label);
  if (!a) return false;
  const estado = normalizeEstado(a.estado ?? "disponible");
  return estado !== "disponible" && estado !== "bloqueado" && !sellSeats.value.includes(label);
}

function isOwnBlocked(label: string): boolean {
  const a = findAsientoByLabel(label);
  if (!a || !currentUserId.value) return false;
  const estado = normalizeEstado(a.estado ?? "disponible");
  return estado === "bloqueado" && String(a.id_usuario) === currentUserId.value && !sellSeats.value.includes(label);
}

function isBlockedByOther(label: string): boolean {
  const a = findAsientoByLabel(label);
  if (!a) return false;
  const estado = normalizeEstado(a.estado ?? "disponible");
  return estado === "bloqueado" && String(a.id_usuario) !== currentUserId.value && !sellSeats.value.includes(label);
}

const sellTotal = computed(() =>
  sellSeats.value.length * (sellShowtime.value ? priceFor(sellShowtime.value.format) : 0)
);

const canSell = computed(() => {
  if (sellSeats.value.length === 0 || sellCustomerName.value.trim().length === 0) return false;
  if (paymentMethod.value === "efectivo") return cashReceived.value >= sellTotal.value;
  return !!(cardNumber.value && cardExpiry.value && cardCvv.value);
});

async function toggleSellSeat(seat: string) {
  if (sellSeats.value.includes(seat)) {
    sellSeats.value = sellSeats.value.filter((item) => item !== seat);
    sellingError.value = "";
    const a = findAsientoByLabel(seat);
    if (a && asientos.value.length > 0) {
      liberar(showtimeId.value, String(a.id_asiento ?? a.id));
    }
    return;
  }

  if (isReserved(seat) || isBlockedByOther(seat)) return;

  if (asientos.value.length === 0) {
    sellSeats.value = [...sellSeats.value, seat];
    return;
  }

  const a = findAsientoByLabel(seat);
  if (!a) return;

  const blocked = await bloquear(showtimeId.value, String(a.id_asiento ?? a.id));
  console.log("[SellSeatSelectionView] toggleSeat bloqueo:", { label: seat, id_asiento: a.id_asiento, result: blocked });
  if (!blocked) {
    sellingError.value = `El asiento ${seat} ya no esta disponible.`;
    const idx = asientos.value.findIndex((as) => as.id === a.id);
    if (idx >= 0) {
      asientos.value[idx] = { ...asientos.value[idx], estado: "reservado" };
    }
    return;
  }

  sellingError.value = "";
  sellSeats.value = [...sellSeats.value, seat];
}

function extractUserIdFromToken(): number {
  const token = localStorage.getItem("access_token");
  if (!token) return 0;
  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    return Number(decoded.userId || decoded.sub || decoded.id || decoded.user_id || 0);
  } catch {
    return 0;
  }
}

async function confirmSell() {
  if (!sellShowtime.value || !canSell.value) return;
  isConfirming.value = true;
  sellError.value = "";

  const userId = extractUserIdFromToken();
  if (!userId) {
    sellError.value = "Error de sesion. Vuelve a iniciar sesion.";
    isConfirming.value = false;
    return;
  }

  const selectedAsientos = asientos.value.filter((a) => {
    const label = `${String.fromCharCode(64 + (a.fila ?? 0))}${a.columna ?? 0}`;
    return sellSeats.value.includes(label);
  });
  const asientosIds = selectedAsientos.length > 0
    ? selectedAsientos.map((a) => Number(a.id))
    : sellSeats.value.map((_, i) => -(i + 1));

  console.log("[SellSeatSelectionView] confirmSell asientosIds:", asientosIds);

  try {
    const reservaCreada = await reservasService.create({
      id_usuario: userId,
      id_funcion: Number(showtimeId.value),
      asientosIds,
    });

    const precioPorAsiento = sellShowtime.value ? priceFor(sellShowtime.value.format) : sellTotal.value / sellSeats.value.length;

    if (paymentMethod.value === "efectivo") {
      await reservasService.processCashPayment({
        id_reserva: Number(reservaCreada.id),
        precio_por_asiento: precioPorAsiento,
      });
    } else {
      await reservasService.processPayment({
        id_reserva: Number(reservaCreada.id),
        metodo: "tarjeta",
        precio_por_asiento: precioPorAsiento,
      });
    }

    const reservation: Reservation = {
      id: String(reservaCreada.id),
      apiId: Number(reservaCreada.id),
      customerName: sellCustomerName.value.trim(),
      customerEmail: "venta-en-taquilla@cine.com",
      movieId: sellShowtime.value.movieId,
      showtimeId: sellShowtime.value.id,
      cinemaId: sellShowtime.value.cinemaId,
      roomId: sellShowtime.value.roomId,
      date: sellShowtime.value.date,
      time: sellShowtime.value.time,
      seats: [...sellSeats.value],
      status: "confirmada",
      paymentStatus: "pagado",
      paymentMethod: paymentMethod.value,
      transactionId: `TX-${Date.now()}`,
      total: sellTotal.value,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    reservationsStore.addReservation(reservation);
    sellReceipt.value = reservation;
  } catch {
    sellError.value = "Error al procesar la venta. Intenta de nuevo.";
  }
  isConfirming.value = false;
}

function closeSellReceipt() {
  sellReceipt.value = null;
  sellSeats.value = [];
  sellCustomerName.value = "";
  cashReceived.value = 0;
  cardNumber.value = "";
  cardExpiry.value = "";
  cardCvv.value = "";
  paymentMethod.value = "efectivo";
  sellingError.value = "";
  router.push("/recepcion/vender");
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; width: min(100%, 1100px); margin: 0 auto 24px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(22px, 3vw, 34px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { color: #f0ece4; margin: 0; font-size: 1rem; font-weight: 600; }
p { color: #7a7590; margin: 0; font-size: .875rem; }
.booking-grid { width: min(100%, 1100px); margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 380px); gap: 18px; align-items: start; }
.seat-card { min-width: 0; padding: 1.25rem; overflow: hidden; }
.screen { text-align: center; padding: 8px; border-bottom: 2px solid rgba(200,169,110,0.3); color: #7a7590; margin: 0 0 16px; font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; font-family: 'DM Mono', monospace; }
.seat-scroll { overflow-x: auto; overflow-y: hidden; padding: 0 0 10px; scrollbar-width: thin; scrollbar-color: rgba(200,169,110,.4) rgba(255,255,255,.04); }
.seat-scroll::-webkit-scrollbar { display: block; height: 6px; }
.seat-scroll::-webkit-scrollbar-thumb { background: rgba(200,169,110,.4); border-radius: 999px; }
.seat-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.04); border-radius: 999px; }
.seat-map { display: grid; gap: 7px; width: max-content; min-width: 100%; justify-content: center; }
.seat { width: 44px; height: 38px; border: 1px solid rgba(200,169,110,0.14); background: rgba(255,255,255,0.03); color: #9e9ab0; border-radius: 3px; font-size: 11px; font-family: 'DM Mono', monospace; transition: background .1s, border-color .1s; }
.seat:hover:not(:disabled) { background: rgba(200,169,110,0.08); border-color: rgba(200,169,110,0.3); }
.seat.selected { background: #c8a96e; border-color: #c8a96e; color: #0a0a0f; font-weight: 600; }
.seat.reserved { background: rgba(200,60,60,0.18); color: rgba(255,255,255,0.3); cursor: not-allowed; border-color: rgba(200,60,60,0.2); }
.seat.own-blocked { background: rgba(200,169,110,0.15); color: #c8a96e; border-color: rgba(200,169,110,0.3); }
.seat.blocked-other { background: rgba(200,60,60,0.18); color: rgba(255,255,255,0.3); cursor: not-allowed; border-color: rgba(200,60,60,0.2); }
.legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; color: #7a7590; font-size: .75rem; }
.seat-dot { display: inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; border: 1px solid rgba(200,169,110,0.2); }
.selected-dot { background: #c8a96e; border-color: #c8a96e; }
.own-blocked-dot { background: rgba(200,169,110,0.3); border-color: rgba(200,169,110,0.5); }
.reserved-dot { background: rgba(200,60,60,0.45); border-color: rgba(200,60,60,0.3); }
.checkout-card { display: grid; gap: 12px; min-width: 0; padding: 1.375rem; position: sticky; top: 72px; }
.field { display: grid; gap: 6px; color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.summary-line { display: flex; justify-content: space-between; gap: 14px; align-items: center; font-size: .875rem; }
.summary-line strong { text-align: right; color: #f0ece4; }
.selected-seat-list { max-width: 180px; overflow-wrap: anywhere; font-size: .8125rem; }
.summary-line.total { font-size: 1.0625rem; font-weight: 600; padding-top: 10px; border-top: 1px solid rgba(200,169,110,0.12); }
.full { width: 100%; }
.pos-cash-row { display: flex; gap: 12px; align-items: end; }
.pos-change { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; border: 1px solid rgba(76,175,125,0.25); border-radius: 3px; padding: .5rem .75rem; background: rgba(76,175,125,0.05); }
.pos-change strong { font-size: 1.125rem; color: #4caf7d; }
.payment-grid { display: grid; gap: 8px; }
.error-msg { color: #e8607a; font-size: .75rem; margin: 0; }
.legend-error { width: 100%; margin-top: 4px; }
.empty-state { padding: 3rem 1.5rem; text-align: center; color: #7a7590; font-size: .875rem; }
@media (max-width: 900px) {
  .booking-grid { grid-template-columns: 1fr; }
  .checkout-card { position: static; }
}
@media (max-width: 640px) {
  .section-header { align-items: stretch; flex-direction: column; }
  .section-header .ghost-button { justify-content: center; width: 100%; }
  .seat-card, .checkout-card { padding: 1rem; }
  .seat-map { gap: 5px; justify-content: start; }
  .seat { width: 38px; height: 34px; font-size: 10px; }
  .summary-line { align-items: flex-start; }
}
</style>
