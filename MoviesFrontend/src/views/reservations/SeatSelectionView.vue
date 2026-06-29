<template>
    <section class="page">
        <div class="section-header">
            <div>
                <p class="eyebrow">Reserva de entradas</p>
                <h1>Selecciona tus asientos</h1>
            </div>
            <button class="ghost-button" type="button" @click="router.push('/reservas/funciones')">
                Volver a funciones
            </button>
        </div>

        <div v-if="isPending && asientos.length === 0" class="empty-state card">
            Cargando asientos...
        </div>

        <div v-else-if="asientos.length === 0" class="empty-state card">
            No hay asientos disponibles para esta función.
        </div>

        <div v-else class="booking-grid">
            <article class="card seat-card">
                <div class="screen">Pantalla</div>
                <div class="seat-scroll" aria-label="Mapa de asientos">
                    <div class="seat-map" :style="{
                        gridTemplateColumns: `repeat(${gridCols || 10}, 48px)`,
                    }">
                        <button v-for="asiento in seatList" :key="asiento.id" type="button" class="seat" :class="{
                            reserved: isReserved(asiento),
                            selected: isSelected(asiento),
                        }" :disabled="isReserved(asiento)" @click="toggleSeat(asiento)">
                            {{ asiento.label }}
                        </button>
                    </div>
                </div>
                <div class="legend">
                    <span><i class="seat-dot available"></i>Disponible</span>
                    <span><i class="seat-dot selected-dot"></i>Seleccionado</span>
                    <span><i class="seat-dot reserved-dot"></i>Reservado</span>
                    <span v-if="blockingError" class="error-msg">{{
                        blockingError
                        }}</span>
                </div>
            </article>

            <aside class="card checkout-card">
                <h2>{{ movie?.title }}</h2>
                <p>{{ cinema?.name }} · {{ roomName }}</p>
                <p>{{ formatDate(showtimeDate) }} · {{ showtimeTime }}</p>
                <div class="summary-line">
                    <span>Asientos</span>
                    <strong class="selected-seat-list">{{
                        selectedSeatLabels.join(", ") || "Sin seleccionar"
                        }}</strong>
                </div>
                <div class="summary-line countdown">
                    <span>Bloqueo</span>
                    <strong>{{ lockCountdown }}</strong>
                </div>
                <div class="summary-line">
                    <span>Subtotal</span>
                    <strong>{{ money(subtotal) }}</strong>
                </div>
                <div class="coupon-row">
                    <input v-model.trim="couponCode" class="input" placeholder="Cupón" />
                    <button class="ghost-button" type="button" @click="applyCoupon">
                        Aplicar
                    </button>
                </div>
                <p v-if="couponMessage" class="form-note">
                    {{ couponMessage }}
                </p>
                <div class="summary-line">
                    <span>Descuento</span>
                    <strong>-{{ money(discount) }}</strong>
                </div>
                <div class="summary-line total">
                    <span>Total</span>
                    <strong>{{ money(total) }}</strong>
                </div>

                <label class="field">
                    Método de pago
                    <select v-model="paymentMethod" class="input">
                        <option value="tarjeta">Tarjeta</option>
                    </select>
                </label>
                <div v-if="paymentMethod === 'tarjeta'" class="payment-grid">
                    <input v-model="cardNumber" class="input" placeholder="Número de tarjeta" />
                    <input v-model="cardExpiry" class="input" placeholder="MM/AA" />
                    <input v-model="cardCvv" class="input" placeholder="CVV" />
                </div>
                <p class="policy-box">
                    Puedes cancelar antes de la función. El reembolso estimado
                    depende de la política configurada y se verá en Mis
                    reservas.
                </p>
                <button class="primary-button full" type="button" :disabled="!canConfirm || isConfirming"
                    @click="confirmReservation">
                    {{
                        isConfirming
                            ? "Bloqueando asientos..."
                            : "Confirmar y pagar"
                    }}
                </button>
                <p v-if="confirmationError" class="error-box">
                    {{ confirmationError }}
                </p>
                <p v-if="confirmation" class="success-box">
                    {{ confirmation }}
                </p>
            </aside>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCatalogStore } from "../../stores/catalog";
import { useReservationsStore } from "../../stores/reservations";
import { useSessionStore } from "../../stores/session";
import { useFormat } from "../../composables/use-format";
import { useFunciones } from "../../composables/use-funciones";
import { reservasService } from "../../services/reservas.service";
import type { Asiento } from "../../services/funciones.service";
import type { PaymentMethod, Reservation } from "../../types";

interface SeatItem {
    id: string;
    id_asiento: string;
    label: string;
    fila: number;
    columna: number;
    estado: string;
}

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const session = useSessionStore();
const { reservations, coupons } = storeToRefs(reservationsStore);
const { money, formatDate } = useFormat();
const { asientos, fetchAsientos, bloquearAsiento, isPending } = useFunciones();

// ── Route context ──────────────────────────────────────────────────────────────
const showtimeId = computed(() => String(route.params.showtimeId));
const movieId = computed(() => String(route.query.movieId ?? ""));
const cinemaId = computed(() => String(route.query.cinemaId ?? ""));
const roomName = computed(() => String(route.query.room ?? "Sala"));
const fechaHora = computed(() => String(route.query.fecha ?? ""));
const showtimeDate = computed(() => {
    const d = fechaHora.value.split("T")[0];
    return d ?? fechaHora.value;
});
const showtimeTime = computed(() => {
    const raw = fechaHora.value.split("T")[1];
    return raw ? raw.slice(0, 5) : "";
});

const movie = computed(() => catalog.movieById(movieId.value));
const cinema = computed(() => catalog.cinemaById(cinemaId.value));

// ── Seat state ──────────────────────────────────────────────────────────────────
const selectedSeats = ref<string[]>([]); // asiento.id values
const blockingError = ref("");

const couponCode = ref("");
const appliedCouponId = ref("");
const couponMessage = ref("");
const paymentMethod = ref<PaymentMethod>("tarjeta");
const cardNumber = ref("");
const cardExpiry = ref("");
const cardCvv = ref("");
const confirmation = ref("");
const confirmationError = ref("");
const isConfirming = ref(false);
const lockedUntil = ref(0);
const now = ref(Date.now());
let timer: number | undefined;
const appliedCouponCode = ref("");
const appliedCouponType = ref("");
const appliedCouponValue = ref(0);

// ── Derived data ────────────────────────────────────────────────────────────────
const unitPrice = ref(7);
const subtotal = computed(() => selectedSeats.value.length * unitPrice.value);
const discount = computed(() => {
    if (!appliedCouponCode.value) return 0;
    return appliedCouponType.value === "porcentaje"
        ? subtotal.value * (appliedCouponValue.value / 100)
        : appliedCouponValue.value;
});
const total = computed(() => Math.max(0, subtotal.value - discount.value));
const canConfirm = computed(
    () =>
        selectedSeats.value.length > 0 &&
        (paymentMethod.value !== "tarjeta" ||
            Boolean(cardNumber.value && cardExpiry.value && cardCvv.value)),
);

const gridCols = computed(() =>
    Math.max(...asientos.value.map((a) => a.columna ?? 0), 0),
);

const seatList = computed<SeatItem[]>(() =>
    asientos.value
        .filter((a) => a.fila != null && a.columna != null)
        .map((a) => ({
            id: String(a.id),
            id_asiento: String(a.id_asiento ?? a.id),
            label: `${String.fromCharCode(64 + a.fila!)}${a.columna!}`,
            fila: a.fila!,
            columna: a.columna!,
            estado: a.estado ?? "disponible",
        }))
        .sort((a, b) => a.fila - b.fila || a.columna - b.columna),
);

const selectedSeatLabels = computed(() =>
    seatList.value
        .filter((s) => selectedSeats.value.includes(s.id))
        .map((s) => s.label),
);

const lockCountdown = computed(() => {
    const remaining = Math.max(0, lockedUntil.value - now.value);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

// ── Helpers ─────────────────────────────────────────────────────────────────────
function isReserved(asiento: SeatItem) {
    return (
        asiento.estado !== "disponible" &&
        !selectedSeats.value.includes(asiento.id)
    );
}

function isSelected(asiento: SeatItem) {
    return selectedSeats.value.includes(asiento.id);
}

// ── Lifecycle ───────────────────────────────────────────────────────────────────
onMounted(async () => {
    if (!session.user) {
        router.push({
            path: "/login",
            query: {
                reason: "checkout",
                redirect: route.fullPath,
            },
        });
        return;
    }

    if (!movieId.value || !cinemaId.value) {
        router.replace("/reservas/funciones");
        return;
    }

    await fetchAsientos(showtimeId.value);
    console.log("showtimeId:", showtimeId.value);
    console.log("asientos:", asientos.value);

    timer = window.setInterval(() => {
        now.value = Date.now();
        if (lockedUntil.value > 0 && lockedUntil.value <= now.value) {
            router.push("/reservas/funciones");
        }
    }, 1000);
});

onUnmounted(() => {
    if (timer) window.clearInterval(timer);
});

// ── Seat toggle (local only — block happens on purchase) ────────────────────────
function toggleSeat(asiento: SeatItem) {
    if (isReserved(asiento)) return;

    if (selectedSeats.value.includes(asiento.id)) {
        selectedSeats.value = selectedSeats.value.filter(
            (id) => id !== asiento.id,
        );
        if (selectedSeats.value.length === 0) {
            lockedUntil.value = 0;
        }
        return;
    }

    selectedSeats.value = [...selectedSeats.value, asiento.id];

    if (selectedSeats.value.length === 1) {
        lockedUntil.value = Date.now() + 5 * 60 * 1000;
    }
}

// ── Coupon & reservation ────────────────────────────────────────────────────────
async function applyCoupon() {
    if (!couponCode.value) {
        couponMessage.value = "";
        appliedCouponId.value = "";
        appliedCouponCode.value = "";
        return;
    }

    const code = couponCode.value.toUpperCase().trim();
    const result = await reservasService.validateCoupon({ codigo: code });

    if (result) {
        appliedCouponCode.value = code;
        appliedCouponType.value = result.tipo;
        appliedCouponValue.value = Number(result.valor);
        couponMessage.value = `Cupón ${code} aplicado.`;
    } else {
        appliedCouponCode.value = "";
        appliedCouponType.value = "";
        appliedCouponValue.value = 0;
        couponMessage.value = "Cupón no disponible, expirado, o agotado.";
    }
}

async function confirmReservation() {
    if (!canConfirm.value || !session.user) return;
    isConfirming.value = true;
    confirmationError.value = "";
    blockingError.value = "";

    const selectedItems = seatList.value.filter((s) =>
        selectedSeats.value.includes(s.id),
    );

    // 2. Get user ID from JWT
    let userId: number;
    try {
        const token = localStorage.getItem("access_token");
        console.log("TOKEN:", token);

        if (!token) throw new Error("No token");

        const parts = token.split(".");
        console.log("TOKEN PARTS:", parts);

        const decoded = JSON.parse(atob(parts[1]));
        console.log("DECODED:", decoded);

        userId = Number(decoded.userId);
        console.log("USER ID:", userId);

        if (!userId) throw new Error("No user ID in token");
    } catch (e) {
        console.error("AUTH ERROR:", e);
        confirmationError.value =
            "Error de autenticación. Inicia sesión de nuevo.";
        isConfirming.value = false;
        return;
    }

    // 3. Create reservation via API
    let reservaCreada: Awaited<ReturnType<typeof reservasService.create>>;
    try {
        reservaCreada = await reservasService.create({
            id_usuario: userId,
            id_funcion: Number(showtimeId.value),
            asientosIds: selectedItems.map((s) => Number(s.id)),
        });
    } catch {
        confirmationError.value =
            "Error al crear la reserva. Intenta de nuevo.";
        isConfirming.value = false;
        return;
    }

    // 4. Process payment
    try {
        await reservasService.processPayment({
            id_reserva: Number(reservaCreada.id),
            metodo: paymentMethod.value,
            precio_por_asiento: unitPrice.value,
            ...(appliedCouponCode.value
                ? { codigo_cupon: appliedCouponCode.value }
                : {}),
        });
    } catch {
        confirmationError.value =
            "Reserva creada pero hubo un error con el pago. Contacta a soporte.";
        isConfirming.value = false;
        return;
    }

    // 5. Block every selected seat on the server

    for (const seat of selectedItems) {
        const result = await bloquearAsiento(showtimeId.value, seat.id_asiento);
        if (!result) {
            confirmationError.value = `Error al bloquear el asiento ${seat.label}. Intenta de nuevo.`;
            isConfirming.value = false;
            return;
        }
    }

    // 6. Save locally and navigate
    const reservation: Reservation = {
        id: String(reservaCreada.id),
        customerName: session.user.name,
        customerEmail: session.user.email,
        movieId: movieId.value,
        showtimeId: showtimeId.value,
        cinemaId: cinemaId.value,
        roomId: showtimeId.value,
        date: showtimeDate.value,
        time: showtimeTime.value,
        seats: [...selectedSeatLabels.value],
        status: "confirmada",
        paymentStatus: "pagado",
        paymentMethod: paymentMethod.value,
        transactionId: `TX-${Date.now()}`,
        couponCode: appliedCouponCode.value || undefined,
        discount: discount.value,
        total: total.value,
        createdAt: new Date().toISOString().slice(0, 10),
    };
    reservationsStore.addReservation(
        reservation,
        appliedCouponId.value || undefined,
    );
    confirmation.value = `Reserva ${reservation.id} confirmada.`;
    isConfirming.value = false;
    router.push(`/reservas/resultado/${reservation.id}`);
}
</script>

<style scoped>
.section-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-end;
    width: min(100%, 1100px);
    margin: 0 auto 24px;
}

.eyebrow {
    color: #c8a96e;
    font-family: "DM Mono", monospace;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.09em;
    margin: 0 0 4px;
}

h1 {
    font-size: clamp(22px, 3vw, 34px);
    font-weight: 600;
    color: #f0ece4;
    margin: 0;
    font-family: "Playfair Display", serif;
    letter-spacing: -0.01em;
}

h2 {
    color: #f0ece4;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

p {
    color: #7a7590;
    margin: 0;
    font-size: 0.875rem;
}

.empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
    color: #7a7590;
    font-size: 0.875rem;
}

.booking-grid {
    width: min(100%, 1100px);
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
    gap: 18px;
    align-items: start;
}

.seat-card {
    min-width: 0;
    padding: 1.25rem;
    overflow: hidden;
}

.screen {
    text-align: center;
    padding: 8px;
    border-bottom: 2px solid rgba(200, 169, 110, 0.3);
    color: #7a7590;
    margin: 0 0 16px;
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-family: "DM Mono", monospace;
}

.seat-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 0 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(200, 169, 110, 0.4) rgba(255, 255, 255, 0.04);
}

.seat-scroll::-webkit-scrollbar {
    display: block;
    height: 6px;
}

.seat-scroll::-webkit-scrollbar-thumb {
    background: rgba(200, 169, 110, 0.4);
    border-radius: 999px;
}

.seat-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.04);
    border-radius: 999px;
}

.seat-map {
    display: grid;
    gap: 7px;
    width: max-content;
    min-width: 100%;
    justify-content: center;
}

.seat {
    width: 44px;
    height: 38px;
    border: 1px solid rgba(200, 169, 110, 0.14);
    background: rgba(255, 255, 255, 0.03);
    color: #9e9ab0;
    border-radius: 3px;
    font-size: 11px;
    font-family: "DM Mono", monospace;
    transition:
        background 0.1s,
        border-color 0.1s;
}

.seat:hover:not(:disabled) {
    background: rgba(200, 169, 110, 0.08);
    border-color: rgba(200, 169, 110, 0.3);
}

.seat.selected {
    background: #c8a96e;
    border-color: #c8a96e;
    color: #0a0a0f;
    font-weight: 600;
}

.seat.reserved {
    background: rgba(200, 60, 60, 0.18);
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
    border-color: rgba(200, 60, 60, 0.2);
}

.legend {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin-top: 14px;
    color: #7a7590;
    font-size: 0.75rem;
}

.seat-dot {
    display: inline-block;
    width: 11px;
    height: 11px;
    border-radius: 3px;
    margin-right: 5px;
    vertical-align: -1px;
    border: 1px solid rgba(200, 169, 110, 0.2);
}

.selected-dot {
    background: #c8a96e;
    border-color: #c8a96e;
}

.reserved-dot {
    background: rgba(200, 60, 60, 0.45);
    border-color: rgba(200, 60, 60, 0.3);
}

.checkout-card {
    display: grid;
    gap: 12px;
    min-width: 0;
    padding: 1.375rem;
    position: sticky;
    top: 72px;
}

.field {
    display: grid;
    gap: 6px;
    color: #c8a96e;
    font-size: 0.8125rem;
    font-weight: 500;
}

.summary-line {
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: center;
    font-size: 0.875rem;
}

.summary-line strong {
    text-align: right;
    color: #f0ece4;
}

.selected-seat-list {
    max-width: 180px;
    overflow-wrap: anywhere;
    font-size: 0.8125rem;
}

.summary-line.total {
    font-size: 1.0625rem;
    font-weight: 600;
    padding-top: 10px;
    border-top: 1px solid rgba(200, 169, 110, 0.12);
}

.coupon-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 7px;
}

.payment-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 88px 78px;
    gap: 7px;
}

.policy-box,
.success-box {
    border-radius: 3px;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.04);
    color: #7a7590;
    font-size: 0.8125rem;
    line-height: 1.5;
}

.success-box {
    color: #4caf7d;
    background: rgba(76, 175, 125, 0.06);
}

.error-box {
    color: #e06060;
    background: rgba(200, 60, 60, 0.06);
    border-radius: 3px;
    padding: 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.5;
}

.error-msg {
    color: #e06060;
    font-size: 0.75rem;
}

.form-note {
    font-size: 0.75rem;
    color: #c8a96e;
    margin: 0;
}

.full {
    width: 100%;
}

.countdown strong {
    color: #c8a96e;
    font-family: "DM Mono", monospace;
}

@media (max-width: 900px) {
    .booking-grid {
        grid-template-columns: 1fr;
    }

    .checkout-card {
        position: static;
    }

    .payment-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 640px) {
    .section-header {
        align-items: stretch;
        flex-direction: column;
    }

    .section-header .ghost-button {
        justify-content: center;
        width: 100%;
    }

    .seat-card,
    .checkout-card {
        padding: 1rem;
    }

    .seat-map {
        gap: 5px;
        justify-content: start;
    }

    .seat {
        width: 38px;
        height: 34px;
        font-size: 10px;
    }

    .coupon-row {
        grid-template-columns: 1fr;
    }

    .summary-line {
        align-items: flex-start;
    }
}
</style>
