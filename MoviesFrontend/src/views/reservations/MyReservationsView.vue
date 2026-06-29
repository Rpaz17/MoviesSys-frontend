<template>
    <section class="page">
        <div class="section-header">
            <div>
                <p class="eyebrow">Reserva de entradas</p>
                <h1>Mis reservas</h1>
            </div>
        </div>

        <div v-if="isPending" class="empty-state card">
            Cargando reservas...
        </div>

        <div v-else-if="error" class="empty-state card" style="color: #e06060">
            {{ error }}
        </div>

        <div v-else-if="myReservations.length === 0" class="empty-state card">
            Aún no tienes reservas activas.
        </div>

        <div v-else class="stack">
            <article
                v-for="reservation in myReservations"
                :key="reservation.id"
                class="card reservation-row"
            >
                <div>
                    <span class="pill">{{ reservation.status }}</span>
                    <h2>{{ reservation.movieTitle }}</h2>
                    <p>
                        {{ reservation.cinemaName }} ·
                        {{ reservation.roomName }}
                    </p>
                    <p>
                        {{ reservation.date }} · {{ reservation.time }} ·
                        Asientos {{ reservation.seats.join(", ") }}
                    </p>
                    <p v-if="reservation.refundStatus">
                        Reembolso: {{ reservation.refundStatus }} ·
                        {{ money(reservation.refundAmount ?? 0) }}
                    </p>
                </div>
                <div class="row-actions">
                    <strong>{{ money(reservation.total) }}</strong>
                    <button
                        class="ghost-button"
                        type="button"
                        @click="openDetail(reservation)"
                    >
                        Ver detalle
                    </button>
                    <button
                        v-if="reservation.status !== 'cancelada'"
                        class="danger-button"
                        type="button"
                        @click="openCancel(reservation)"
                    >
                        Cancelar reserva
                    </button>
                </div>
            </article>
        </div>

        <ReservationDetailModal
            v-if="selectedReservation"
            :reservation="selectedReservation"
            @close="selectedReservation = null"
        />

        <CancelReservationModal
            v-if="cancelTarget"
            :reservation="cancelTarget"
            @close="cancelTarget = null"
            @confirm="confirmCancel"
        />
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSessionStore } from "../../stores/session";
import { useFormat } from "../../composables/use-format";
import { useReservas } from "../../composables/use-reservas";
import ReservationDetailModal from "../../components/ReservationDetailModal.vue";
import CancelReservationModal from "../../components/CancelReservationModal.vue";
import type { Reservation } from "../../types";
import type { ReservaAPI } from "../../services/reservas.service";

const session = useSessionStore();
const { money } = useFormat();
const { reservas, fetchReservas, cancelReserva, isPending, error } =
    useReservas();

const selectedReservation = ref<Reservation | null>(null);
const cancelTarget = ref<Reservation | null>(null);

interface MyReservationDisplay {
    id: string;
    status: string;
    movieTitle: string;
    cinemaName: string;
    roomName: string;
    numeroReserva?: string;
    date: string;
    time: string;
    seats: string[];
    total: number;
    paymentStatus: string;
    paymentMethod?: string;
    transactionId?: string;
    couponCode?: string;
    discount?: number;
    refundStatus?: string;
    refundAmount?: number;
    customerName: string;
    customerEmail: string;
    createdAt: string;
}

function mapReserva(r: ReservaAPI): MyReservationDisplay {
    const [date, timeRaw] = (r.funciones?.fecha_hora ?? "").split("T");
    const time = timeRaw ? timeRaw.slice(0, 5) : "";
    const seatCodes =
        r.reservaAsientos?.map((ra) => ra.asientosfuncion.asientos.codigo) ??
        [];
    return {
        id: String(r.id),
        status: r.estado === "cancelada" ? "cancelada" : "confirmada",
        movieTitle: r.funciones?.peliculas?.titulo ?? "Película",
        cinemaName: r.funciones?.salas?.cines?.nombre ?? "Cine",
        roomName: r.funciones?.salas?.nombre ?? "Sala",
        numeroReserva: r.numero_reserva,
        date,
        time,
        seats:
            seatCodes.length > 0
                ? seatCodes
                : ["Sin asientos"],
        total: seatCodes.length * 7,
        paymentStatus: "pagado",
        customerName: r.usuarios?.nombre ?? "",
        customerEmail: r.usuarios?.email ?? "",
        createdAt: r.created_at ?? "",
    };
}

const myReservations = computed<MyReservationDisplay[]>(() =>
    reservas.value.map(mapReserva),
);

onMounted(async () => {
    await fetchReservas();
});

function openDetail(item: MyReservationDisplay) {
    selectedReservation.value = {
        id: item.id,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        movieId: "",
        showtimeId: "",
        cinemaId: "",
        roomId: "",
        movieTitle: item.movieTitle,
        cinemaName: item.cinemaName,
        roomName: item.roomName,
        numeroReserva: item.numeroReserva,
        date: item.date,
        time: item.time,
        seats: item.seats,
        status: item.status as Reservation["status"],
        paymentStatus: item.paymentStatus as Reservation["paymentStatus"],
        total: item.total,
        createdAt: item.createdAt,
    };
}

function openCancel(item: MyReservationDisplay) {
    // Build a minimal Reservation for the modal
    cancelTarget.value = {
        id: item.id,
        customerName: item.customerName,
        customerEmail: item.customerEmail,
        movieId: "",
        showtimeId: "",
        cinemaId: "",
        roomId: "",
        date: item.date,
        time: item.time,
        seats: item.seats,
        status: item.status as Reservation["status"],
        paymentStatus: "pagado",
        total: item.total,
        createdAt: item.createdAt,
    };
}

async function confirmCancel() {
    if (!cancelTarget.value) return;
    const ok = await cancelReserva(cancelTarget.value.id);
    if (ok) {
        await fetchReservas();
    }
    cancelTarget.value = null;
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
.stack {
    width: min(100%, 1100px);
    margin: 0 auto;
    display: grid;
    gap: 12px;
}
.reservation-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 1.25rem 1.5rem;
}
.row-actions {
    display: grid;
    gap: 8px;
    justify-items: end;
}
.row-actions strong {
    color: #f0ece4;
}
.danger-button {
    border-radius: 3px;
    padding: 0.4375rem 0.875rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #ffd8df;
    border: 1px solid rgba(232, 96, 122, 0.3);
    background: rgba(232, 96, 122, 0.08);
    transition: background 0.12s;
}
.danger-button:hover {
    background: rgba(232, 96, 122, 0.15);
}
@media (max-width: 900px) {
    .reservation-row {
        align-items: stretch;
        flex-direction: column;
    }
    .row-actions {
        justify-items: stretch;
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
}
</style>
