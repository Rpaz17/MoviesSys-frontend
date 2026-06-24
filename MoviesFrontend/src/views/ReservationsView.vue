<template>
  <div class="app-shell">

    <section class="page">
      <div class="section-header">
        <div>
          <p class="eyebrow">Reserva de entradas</p>
          <h1>{{ pageTitle }}</h1>
        </div>
        <button v-if="selectedShowtime" class="ghost-button" type="button" @click="clearFlow">Volver a
          funciones</button>
      </div>

      <div v-if="(mode === 'functions' || mode === 'movies') && !selectedShowtime">
        <p class="page-description">
          <template v-if="mode === 'functions'">Explora las funciones disponibles en todos nuestros cines. Selecciona
            una función para elegir tus asientos y completar tu reserva.</template>
          <template v-else>Navega nuestro catálogo de películas en cartelera. Selecciona una película para ver las
            funciones y salas disponibles.</template>
        </p>
        <div class="filters-card card">
          <div class="search-wrap">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input v-model.trim="search" class="input search-input" placeholder="Buscar película…" />
          </div>
          <select v-model="genreFilter" class="input">
            <option value="">Todos los géneros</option>
            <option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
          </select>
          <select v-model="languageFilter" class="input">
            <option value="">Todos los idiomas</option>
            <option v-for="language in languages" :key="language" :value="language">{{ language }}</option>
          </select>
          <div class="date-wrap">
            <svg class="date-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="#f0ece4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input v-model="dateFilter" class="input date-input" type="date" />
          </div>
          <select v-model="cityFilter" class="input">
            <option value="">Todas las ciudades</option>
            <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
          </select>
          <select v-model="cinemaFilter" class="input">
            <option value="">Todos los cines</option>
            <option v-for="cinema in cinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option>
          </select>
        </div>
      </div>

      <div v-if="mode === 'movies' && !selectedShowtime" class="grid-list">
        <article v-for="movie in availableMovies" :key="movie.id" class="card function-card">
          <img :src="imageUrl(movie.img)" :alt="movie.title" />
          <div class="card-body">
            <span class="pill">{{ movie.status }}</span>
            <h2>{{ movie.title }}</h2>
            <p>{{ movie.genre }} · {{ movie.language }} · {{ movie.duration }}</p>
            <p>Cines: {{ movieCinemas(movie.id).join(", ") || "Sin funciones activas" }}</p>
            <button class="primary-button" type="button" :disabled="!firstShowtimeForMovie(movie.id)"
              @click="startReservation(firstShowtimeForMovie(movie.id)!)">Ver funciones</button>
          </div>
        </article>
      </div>

      <div v-else-if="mode === 'functions' && !selectedShowtime" class="cinema-groups">
        <section v-for="group in showtimeGroups" :key="group.cinema.id" class="cinema-group">
          <div class="group-heading">
            <div>
              <h2>{{ group.cinema.name }}</h2>
              <p>{{ group.cinema.city }} · {{ group.cinema.address }}</p>
            </div>
            <span class="pill">{{ group.items.length }} funciones</span>
          </div>
          <div class="grid-list">
            <article v-for="showtime in group.items" :key="showtime.id" class="card function-card">
              <img :src="imageUrl(movieFor(showtime.movieId)?.img)" :alt="movieFor(showtime.movieId)?.title" />
              <div class="card-body">
                <span class="pill">{{ showtime.format }}</span>
                <h2>{{ movieFor(showtime.movieId)?.title }}</h2>
                <p>{{ roomFor(showtime.roomId)?.name }}</p>
                <p>{{ showtime.date }} · {{ showtime.time }}</p>
                <div class="row-between">
                  <strong>{{ money(priceFor(showtime.format)) }}</strong>
                  <button class="primary-button" type="button" @click="startReservation(showtime)">Reservar</button>
                </div>
              </div>
            </article>
          </div>
        </section>
        <div v-if="showtimeGroups.length === 0" class="empty-state card">No hay funciones con esos filtros.</div>
      </div>

      <div v-else-if="mode === 'functions' && selectedShowtime">
        <!-- Película seleccionada: banner destacado -->
        <div class="selected-movie-banner">
          <img class="banner-img" :src="imageUrl(selectedMovie?.img)" :alt="selectedMovie?.title" />
          <div class="banner-overlay"></div>
          <div class="banner-content">
            <span class="pill">{{ selectedShowtime.format }}</span>
            <h2 class="banner-title">{{ selectedMovie?.title }}</h2>
            <p class="banner-meta">{{ selectedCinema?.name }} · {{ selectedRoom?.name }} · {{ selectedShowtime.date }}
              {{
              selectedShowtime.time }}</p>
          </div>
        </div>
        <div class="booking-grid">
          <article class="card seat-card">
            <div class="screen">Pantalla</div>
            <div class="seat-scroll" aria-label="Mapa de asientos">
              <div class="seat-map" :style="{ gridTemplateColumns: `repeat(${selectedRoom?.cols ?? 10}, 48px)` }">
                <button v-for="seat in seats" :key="seat" type="button" class="seat"
                  :class="{ reserved: reservedSeats.has(seat), selected: selectedSeats.includes(seat) }"
                  :disabled="reservedSeats.has(seat)" @click="toggleSeat(seat)">
                  {{ seat }}
                </button>
              </div>
            </div>
            <div class="legend">
              <span><i class="seat-dot available"></i>Disponible</span>
              <span><i class="seat-dot selected-dot"></i>Seleccionado</span>
              <span><i class="seat-dot reserved-dot"></i>Reservado</span>
            </div>
          </article>

          <aside class="card checkout-card">
            <h2>{{ selectedMovie?.title }}</h2>
            <p>{{ selectedCinema?.name }} · {{ selectedRoom?.name }}</p>
            <p>{{ selectedShowtime.date }} · {{ selectedShowtime.time }}</p>
            <div class="summary-line"><span>Asientos</span><strong class="selected-seat-list">{{ selectedSeats.join(",") ||
                "Sin seleccionar" }}</strong></div>
            <div class="summary-line countdown"><span>Bloqueo</span><strong>{{ lockCountdown }}</strong></div>
            <div class="summary-line"><span>Subtotal</span><strong>{{ money(subtotal) }}</strong></div>
            <div class="coupon-row">
              <input v-model.trim="couponCode" class="input" placeholder="Cupón" />
              <button class="ghost-button" type="button" @click="applyCoupon">Aplicar</button>
            </div>
            <p v-if="couponMessage" class="form-note">{{ couponMessage }}</p>
            <div class="summary-line"><span>Descuento</span><strong>-{{ money(discount) }}</strong></div>
            <div class="summary-line total"><span>Total</span><strong>{{ money(total) }}</strong></div>

            <label class="field">
              Método de pago
              <select v-model="paymentMethod" class="input">
                <option value="tarjeta">Tarjeta</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </label>
            <div v-if="paymentMethod === 'tarjeta'" class="payment-grid">
              <input v-model="cardNumber" class="input" placeholder="Número de tarjeta" />
              <input v-model="cardExpiry" class="input" placeholder="MM/AA" />
              <input v-model="cardCvv" class="input" placeholder="CVV" />
            </div>
            <div v-if="paymentMethod === 'efectivo'" class="cash-register">
              <div class="cash-total-display">
                <span class="cash-label">Total a cobrar</span>
                <span class="cash-amount">{{ money(total) }}</span>
              </div>
              <label class="field">
                Efectivo recibido del cliente
                <div class="cash-input-wrap">
                  <span class="cash-currency-prefix">L</span>
                  <input v-model.number="cashReceived" class="input cash-input" type="number" min="0" step="0.01"
                    placeholder="0.00" />
                </div>
              </label>
              <div class="quick-amounts">
                <p class="quick-label">Montos rápidos</p>
                <div class="quick-grid">
                  <button v-for="amt in quickAmounts" :key="amt" type="button" class="quick-btn"
                    :class="{ active: cashReceived === amt }" @click="cashReceived = amt">{{ money(amt) }}</button>
                </div>
              </div>
              <div class="cash-result-box"
                :class="{ 'cash-ok': cashSufficient, 'cash-short': cashReceived > 0 && !cashSufficient }">
                <div class="cash-result-row"><span>Efectivo recibido</span><strong>{{ money(cashReceived || 0)
                    }}</strong>
                </div>
                <div class="cash-result-row"><span>Total a cobrar</span><strong>{{ money(total) }}</strong></div>
                <div class="cash-result-divider"></div>
                <div class="cash-result-row change-row">
                  <span>{{ cashSufficient ? 'Cambio a entregar' : 'Falta por cobrar' }}</span>
                  <strong class="change-amount">{{ cashSufficient ? money(cashChange) : money(total - (cashReceived ||
                    0))
                    }}</strong>
                </div>
              </div>
              <p v-if="cashReceived > 0 && !cashSufficient" class="cash-warning">Monto insuficiente. Faltan {{
                money(total -
                cashReceived) }}.</p>
              <details class="denominations">
                <summary>Ver denominaciones de referencia</summary>
                <div class="denom-grid">
                  <span v-for="d in [500, 200, 100, 50, 20, 10, 5, 2, 1]" :key="d" class="denom-chip">L {{ d }}</span>
                </div>
              </details>
            </div>
            <p class="policy-box">Puedes cancelar antes de la función. El reembolso estimado depende de la política
              configurada y se verá en Mis reservas.</p>
            <button class="primary-button full" type="button" :disabled="!canConfirm"
              @click="confirmReservation">Confirmar
              y pagar</button>
            <p v-if="confirmation" class="success-box">{{ confirmation }}</p>
          </aside>
        </div>
      </div>

      <div v-else-if="mode === 'result'" class="result-card card">
        <span class="pill">Pago exitoso</span>
        <h2>Reserva {{ resultReservation?.id }}</h2>
        <p>{{ movieFor(resultReservation?.movieId ?? "")?.title }} · {{ resultReservation?.date }} {{
          resultReservation?.time }}</p>
        <p>Asientos {{ resultReservation?.seats.join(", ") }} · Total {{ money(resultReservation?.total ?? 0) }}</p>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/reservas/mis-reservas')">Ver mis
            reservas</button>
          <button class="primary-button" type="button" @click="router.push('/reservas/funciones')">Comprar otra
            entrada</button>
        </div>
      </div>

      <div v-else-if="mode === 'reception'" class="stack">
        <div class="filters-card card">
          <input v-model.trim="receptionSearch" class="input" placeholder="Buscar por reserva, cliente o pelicula" />
        </div>
        <article v-for="reservation in receptionReservations" :key="reservation.id" class="card reservation-row">
          <div>
            <span class="pill">{{ reservation.paymentStatus }}</span>
            <h2>{{ reservation.id }} · {{ reservation.customerName }}</h2>
            <p>{{ movieFor(reservation.movieId)?.title }} · {{ cinemaFor(reservation.cinemaId)?.name }}</p>
            <p>{{ reservation.date }} {{ reservation.time }} · Asientos {{ reservation.seats.join(", ") }}</p>
          </div>
          <div class="row-actions">
            <strong>{{ money(reservation.total) }}</strong>
            <button v-if="reservation.paymentStatus !== 'pagado'" class="primary-button" type="button"
              @click="reservationsStore.payReservation(reservation.id, 'efectivo')">Pagar efectivo</button>
          </div>
        </article>
      </div>

      <div v-else class="stack">
        <article v-for="reservation in myReservations" :key="reservation.id" class="card reservation-row">
          <div>
            <span class="pill">{{ reservation.status }}</span>
            <h2>{{ movieFor(reservation.movieId)?.title }}</h2>
            <p>{{ cinemaFor(reservation.cinemaId)?.name }} · {{ roomFor(reservation.roomId)?.name }}</p>
            <p>{{ reservation.date }} · {{ reservation.time }} · Asientos {{ reservation.seats.join(", ") }}</p>
            <p v-if="reservation.refundStatus">Reembolso: {{ reservation.refundStatus }} · {{
              money(reservation.refundAmount
              ?? 0) }}</p>
          </div>
          <div class="row-actions">
            <strong>{{ money(reservation.total) }}</strong>
            <button v-if="reservation.status !== 'cancelada'" class="danger-button" type="button"
              @click="openCancel(reservation)">Cancelar reserva</button>
          </div>
        </article>
        <div v-if="myReservations.length === 0" class="empty-state card">Aún no tienes reservas activas.</div>
      </div>

      <div v-if="cancelTarget" class="modal-backdrop" @click.self="cancelTarget = null">
        <article class="modal-card">
          <h2>Confirmar cancelación</h2>
          <p>Política: reembolso completo con más de 24 horas de anticipación, 50% entre 6 y 24 horas, sin reembolso en
            las
            últimas 6 horas.</p>
          <div class="summary-line total"><span>Reembolso estimado</span><strong>{{ money(refundEstimate) }}</strong>
          </div>
          <div class="modal-actions">
            <button class="ghost-button" type="button" @click="cancelTarget = null">Volver</button>
            <button class="danger-button" type="button" @click="confirmCancel">Cancelar reserva</button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCatalogStore } from "../stores/catalog";
import { useReservationsStore } from "../stores/reservations";
import { useSessionStore } from "../stores/session";
import type { PaymentMethod, Reservation, Showtime } from "../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const session = useSessionStore();
const { reservations, coupons } = storeToRefs(reservationsStore);

const selectedShowtime = ref<Showtime | null>(null);
const selectedSeats = ref<string[]>([]);
const couponCode = ref("");
const appliedCouponId = ref("");
const couponMessage = ref("");
const paymentMethod = ref<PaymentMethod>("tarjeta");
const cardNumber = ref("");
const cardExpiry = ref("");
const cardCvv = ref("");
const cashReceived = ref<number>(0);
const confirmation = ref("");
const cancelTarget = ref<Reservation | null>(null);
const search = ref("");
const genreFilter = ref("");
const languageFilter = ref("");
const dateFilter = ref("");
const cityFilter = ref("");
const cinemaFilter = ref("");
const receptionSearch = ref("");
const sidebarCollapsed = ref(false);
const lockedUntil = ref(0);
const now = ref(Date.now());
let timer: number | undefined;

const mode = computed(() => String(route.meta.mode ?? "functions"));
const selectedShowtimeId = computed(() => String(route.query.showtime || ""));
const pageTitle = computed(() => {
  if (mode.value === "mine") return "Mis reservas";
  if (mode.value === "movies") return "Peliculas con cines disponibles";
  if (mode.value === "result") return "Resultado de pago";
  if (mode.value === "reception") return "Caja de recepcion";
  return selectedShowtime.value ? "Selecciona tus asientos" : "Funciones disponibles";
});
const availableShowtimes = computed(() => catalog.showtimes.filter((item) => {
  if (item.status !== "activo") return false;
  const movie = movieFor(item.movieId);
  const cinema = cinemaFor(item.cinemaId);
  const query = search.value.toLowerCase();
  return (!query || movie?.title.toLowerCase().includes(query))
    && (!genreFilter.value || movie?.genre === genreFilter.value)
    && (!languageFilter.value || movie?.language === languageFilter.value)
    && (!dateFilter.value || item.date === dateFilter.value)
    && (!cityFilter.value || cinema?.city === cityFilter.value)
    && (!cinemaFilter.value || item.cinemaId === cinemaFilter.value);
}));
const availableMovies = computed(() => catalog.movies.filter((movie) => {
  const query = search.value.toLowerCase();
  return movie.status !== "inactivo"
    && (!query || movie.title.toLowerCase().includes(query))
    && (!genreFilter.value || movie.genre === genreFilter.value)
    && (!languageFilter.value || movie.language === languageFilter.value)
    && movieCinemas(movie.id).length > 0;
}));
const showtimeGroups = computed(() => catalog.cinemas
  .map((cinema) => ({
    cinema,
    items: availableShowtimes.value.filter((showtime) => showtime.cinemaId === cinema.id),
  }))
  .filter((group) => group.items.length > 0));
const genres = computed(() => [...new Set(catalog.movies.map((movie) => movie.genre))]);
const languages = computed(() => [...new Set(catalog.movies.map((movie) => movie.language))]);
const cities = computed(() => [...new Set(catalog.cinemas.map((cinema) => cinema.city))]);
const cinemas = computed(() => catalog.cinemas.filter((cinema) => !cityFilter.value || cinema.city === cityFilter.value));
const myReservations = computed(() => reservations.value.filter((item) => item.customerEmail === session.user?.email));
const resultReservation = computed(() => reservations.value.find((item) => item.id === route.query.id));
const receptionReservations = computed(() => {
  const query = receptionSearch.value.toLowerCase();
  return reservations.value.filter((reservation) => {
    const movie = movieFor(reservation.movieId)?.title.toLowerCase() ?? "";
    return !query
      || reservation.id.toLowerCase().includes(query)
      || reservation.customerName.toLowerCase().includes(query)
      || movie.includes(query);
  });
});

const selectedMovie = computed(() => selectedShowtime.value ? catalog.movieById(selectedShowtime.value.movieId) : undefined);
const selectedCinema = computed(() => selectedShowtime.value ? catalog.cinemaById(selectedShowtime.value.cinemaId) : undefined);
const selectedRoom = computed(() => selectedShowtime.value ? catalog.roomById(selectedShowtime.value.roomId) : undefined);
const unitPrice = computed(() => selectedShowtime.value ? priceFor(selectedShowtime.value.format) : 0);
const subtotal = computed(() => selectedSeats.value.length * unitPrice.value);
const appliedCoupon = computed(() => coupons.value.find((coupon) => coupon.id === appliedCouponId.value));
const discount = computed(() => {
  if (!appliedCoupon.value) return 0;
  return appliedCoupon.value.type === "porcentaje" ? subtotal.value * (appliedCoupon.value.value / 100) : appliedCoupon.value.value;
});
const total = computed(() => Math.max(0, subtotal.value - discount.value));
const cashSufficient = computed(() => (cashReceived.value || 0) >= total.value && total.value > 0);
const cashChange = computed(() => Math.max(0, (cashReceived.value || 0) - total.value));
const quickAmounts = computed(() => {
  const t = total.value;
  return [...new Set([t, Math.ceil(t / 50) * 50, Math.ceil(t / 100) * 100, Math.ceil(t / 500) * 500])];
});
const canConfirm = computed(() => {
  if (selectedSeats.value.length === 0) return false;
  if (paymentMethod.value === "tarjeta") return Boolean(cardNumber.value && cardExpiry.value && cardCvv.value);
  if (paymentMethod.value === "efectivo") return cashSufficient.value;
  return false;
});
const reservedSeats = computed(() => new Set(reservations.value
  .filter((item) => item.showtimeId === selectedShowtime.value?.id && item.status !== "cancelada")
  .flatMap((item) => item.seats)));
const seats = computed(() => {
  const room = selectedRoom.value;
  if (!room) return [];
  return Array.from({ length: room.rows * room.cols }, (_, index) => `${String.fromCharCode(65 + Math.floor(index / room.cols))}${(index % room.cols) + 1}`);
});
const refundEstimate = computed(() => cancelTarget.value ? calculateRefund(cancelTarget.value) : 0);
const lockCountdown = computed(() => {
  const remaining = Math.max(0, lockedUntil.value - now.value);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

watch(() => route.path, () => clearFlow());
watch([cityFilter, cinemaFilter], () => {
  if (cinemaFilter.value && !cinemas.value.some((cinema) => cinema.id === cinemaFilter.value)) cinemaFilter.value = "";
});
watch(selectedShowtimeId, (id) => {
  if (!id || mode.value !== "functions") return;
  const showtime = availableShowtimes.value.find((item) => item.id === id);
  if (showtime) startReservation(showtime);
}, { immediate: true });

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now();
    if (selectedShowtime.value && lockedUntil.value <= now.value) clearFlow();
  }, 1000);
});

onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});

function movieFor(id: string) {
  return catalog.movieById(id);
}

function cinemaFor(id: string) {
  return catalog.cinemaById(id);
}

function roomFor(id: string) {
  return catalog.roomById(id);
}

function imageUrl(id?: string) {
  if (id?.startsWith("data:") || id?.startsWith("http")) return id;
  return `https://images.unsplash.com/${id ?? "photo-1489599849927-2ee91cede3ba"}?auto=format&fit=crop&w=900&q=80`;
}

function priceFor(format: Showtime["format"]) {
  return ({ "2D": 7, "3D": 9, IMAX: 10, VIP: 12 })[format];
}

function money(value: number) {
  return "L " + new Intl.NumberFormat("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function startReservation(showtime: Showtime) {
  selectedShowtime.value = showtime;
  selectedSeats.value = [];
  confirmation.value = "";
  lockedUntil.value = Date.now() + 5 * 60 * 1000;
}

function clearFlow() {
  selectedShowtime.value = null;
  selectedSeats.value = [];
  couponCode.value = "";
  appliedCouponId.value = "";
  couponMessage.value = "";
  confirmation.value = "";
}

function toggleSeat(seat: string) {
  selectedSeats.value = selectedSeats.value.includes(seat)
    ? selectedSeats.value.filter((item) => item !== seat)
    : [...selectedSeats.value, seat];
}

function applyCoupon() {
  const code = couponCode.value.toUpperCase();
  const coupon = coupons.value.find((item) => item.code === code && item.active && new Date(item.expiresAt) >= new Date());
  appliedCouponId.value = coupon?.id ?? "";
  couponMessage.value = coupon ? `Cupón ${coupon.code} aplicado.` : "Cupón no disponible o vencido.";
}

function confirmReservation() {
  if (!selectedShowtime.value || !canConfirm.value) return;
  if (!session.user) {
    router.push({
      path: "/login",
      query: {
        reason: "checkout",
        redirect: `/reservas/funciones?showtime=${selectedShowtime.value.id}`,
      },
    });
    return;
  }
  const reservation: Reservation = {
    id: `R${Date.now().toString().slice(-6)}`,
    customerName: session.user.name,
    customerEmail: session.user.email,
    movieId: selectedShowtime.value.movieId,
    showtimeId: selectedShowtime.value.id,
    cinemaId: selectedShowtime.value.cinemaId,
    roomId: selectedShowtime.value.roomId,
    date: selectedShowtime.value.date,
    time: selectedShowtime.value.time,
    seats: [...selectedSeats.value],
    status: "confirmada",
    paymentStatus: "pagado",
    paymentMethod: paymentMethod.value,
    transactionId: `TX-${Date.now()}`,
    couponCode: appliedCoupon.value?.code,
    discount: discount.value,
    total: total.value,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  reservationsStore.addReservation(reservation, appliedCouponId.value || undefined);
  confirmation.value = `Reserva ${reservation.id} confirmada.`;
  router.push(`/reservas/resultado?id=${reservation.id}`);
}

function movieCinemas(movieId: string) {
  const cinemaNames = availableShowtimes.value
    .filter((showtime) => showtime.movieId === movieId)
    .map((showtime) => cinemaFor(showtime.cinemaId)?.name)
    .filter(Boolean) as string[];
  return [...new Set(cinemaNames)];
}

function firstShowtimeForMovie(movieId: string) {
  return availableShowtimes.value.find((showtime) => showtime.movieId === movieId);
}

function openCancel(reservation: Reservation) {
  cancelTarget.value = reservation;
}

function calculateRefund(reservation: Reservation) {
  const showDate = new Date(`${reservation.date}T${reservation.time}:00`);
  const hours = (showDate.getTime() - Date.now()) / 36e5;
  if (hours > 24) return reservation.total;
  if (hours > 6) return reservation.total * 0.5;
  return 0;
}

function confirmCancel() {
  if (!cancelTarget.value) return;
  reservationsStore.cancelReservation(cancelTarget.value.id, refundEstimate.value, "Política estándar de cancelación");
  cancelTarget.value = null;
}
</script>

<style scoped>
/* ── App shell ── */
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ── */
.nav-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #13111f;
  border-right: 1px solid rgba(200, 169, 110, 0.1);
  display: flex;
  flex-direction: column;
  transition: width .2s ease;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.nav-sidebar.collapsed {
  width: 48px;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(200, 169, 110, 0.08);
  cursor: pointer;
  color: #7a7590;
  transition: color .12s;
}

.sidebar-toggle:hover {
  color: #c8a96e;
}

.toggle-icon {
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
}

.sidebar-inner {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.sidebar-eyebrow {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .09em;
  color: #c8a96e;
  font-family: "DM Mono", monospace;
  padding: 0 14px 8px;
  white-space: nowrap;
  overflow: hidden;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border-radius: 0;
  color: #7a7590;
  text-decoration: none;
  font-size: .8125rem;
  white-space: nowrap;
  overflow: hidden;
  transition: background .12s, color .12s;
}

.nav-link:hover {
  background: rgba(200, 169, 110, 0.06);
  color: #f0ece4;
}

.nav-link-active {
  background: rgba(200, 169, 110, 0.1);
  color: #c8a96e;
}

.nav-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

.nav-label {
  overflow: hidden;
  white-space: nowrap;
}

.collapsed .nav-label {
  display: none;
}

.collapsed .sidebar-eyebrow {
  opacity: 0;
}

/* ── Page ── */
.page {
  flex: 1;
  min-width: 0;
  padding: 2rem 1.5rem 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  width: min(100%, 900px);
  margin: 0 auto 8px;
}

.eyebrow {
  color: #c8a96e;
  font-family: "DM Mono", monospace;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: .09em;
  margin: 0 0 4px;
}

h1 {
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 600;
  color: #f0ece4;
  margin: 0;
  font-family: 'Playfair Display', serif;
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
  font-size: .875rem;
}

/* ── Page description ── */
.page-description {
  width: min(100%, 900px);
  margin: 0 auto 16px;
  color: #7a7590;
  font-size: .875rem;
  line-height: 1.6;
}

/* ── Filters ── */
.filters-card {
  width: min(100%, 900px);
  margin: 0 auto 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 1rem 1.25rem;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: .75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7a7590;
  pointer-events: none;
}

.search-input {
  padding-left: 2.25rem !important;
}

.date-wrap {
  position: relative;
}

.date-icon {
  position: absolute;
  left: .75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 1;
}

.date-input {
  padding-left: 2.25rem !important;
  color-scheme: dark;
}

.date-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.6;
}

/* ── Grid ── */
.grid-list {
  width: min(100%, 900px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.cinema-groups {
  width: min(100%, 900px);
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.cinema-group {
  display: grid;
  gap: 12px;
}

.group-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: end;
  border-bottom: 1px solid rgba(200, 169, 110, .1);
  padding-bottom: 10px;
}

.function-card {
  overflow: hidden;
  padding: 0;
  transition: transform .15s, border-color .15s;
}

.function-card:hover {
  transform: translateY(-2px);
  border-color: rgba(200, 169, 110, 0.22);
}

.function-card img {
  width: 100%;
  height: 170px;
  object-fit: cover;
}

.card-body {
  padding: 1rem 1.125rem;
  display: grid;
  gap: 8px;
}

/* ── Selected movie banner ── */
.selected-movie-banner {
  position: relative;
  width: min(100%, 900px);
  margin: 0 auto 18px;
  height: 140px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(200, 169, 110, 0.2);
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(10, 10, 20, 0.88) 40%, rgba(10, 10, 20, 0.3));
}

.banner-content {
  position: absolute;
  inset: 0;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.banner-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: #f0ece4;
  font-family: 'Playfair Display', serif;
  margin: 0;
}

.banner-meta {
  font-size: .8125rem;
  color: rgba(240, 236, 228, 0.7);
  margin: 0;
}

/* ── Booking grid ── */
.booking-grid {
  width: min(100%, 900px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
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
  font-size: .75rem;
  letter-spacing: .06em;
  text-transform: uppercase;
  font-family: 'DM Mono', monospace;
}

.seat-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 0 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(200, 169, 110, .4) rgba(255, 255, 255, .04);
}

.seat-scroll::-webkit-scrollbar {
  display: block;
  height: 6px;
}

.seat-scroll::-webkit-scrollbar-thumb {
  background: rgba(200, 169, 110, .4);
  border-radius: 999px;
}

.seat-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, .04);
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
  font-family: 'DM Mono', monospace;
  transition: background .1s, border-color .1s;
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
  font-size: .75rem;
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
  font-size: .8125rem;
  font-weight: 500;
}

.summary-line,
.row-between {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  font-size: .875rem;
}

.summary-line strong {
  text-align: right;
  color: #f0ece4;
}

.selected-seat-list {
  max-width: 180px;
  overflow-wrap: anywhere;
  font-size: .8125rem;
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
  padding: .75rem;
  background: rgba(255, 255, 255, 0.04);
  color: #7a7590;
  font-size: .8125rem;
  line-height: 1.5;
}

.success-box {
  color: #4caf7d;
  background: rgba(76, 175, 125, 0.06);
}

.form-note {
  font-size: .75rem;
  color: #c8a96e;
  margin: 0;
}

.full {
  width: 100%;
}

.stack {
  width: min(100%, 900px);
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

.danger-button {
  border-radius: 3px;
  padding: .4375rem .875rem;
  font-size: .8125rem;
  font-weight: 500;
  color: #ffd8df;
  border: 1px solid rgba(232, 96, 122, .3);
  background: rgba(232, 96, 122, .08);
  transition: background .12s;
}

.danger-button:hover {
  background: rgba(232, 96, 122, .15);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.65);
  z-index: 30;
  backdrop-filter: blur(4px);
}

.modal-card {
  width: min(480px, calc(100vw - 2rem));
  background: #171526;
  border: 1px solid rgba(200, 169, 110, 0.14);
  border-radius: 4px;
  padding: 1.5rem;
  display: grid;
  gap: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.result-card {
  width: min(480px, 100%);
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  gap: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #7a7590;
  font-size: .875rem;
}

/* ── Efectivo ── */
.cash-register {
  display: grid;
  gap: 10px;
}

.cash-total-display {
  background: rgba(200, 169, 110, 0.06);
  border: 1px solid rgba(200, 169, 110, 0.18);
  border-radius: 3px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cash-label {
  font-size: .6875rem;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: #c8a96e;
  font-family: 'DM Mono', monospace;
}

.cash-amount {
  font-size: 1.125rem;
  font-weight: 600;
  color: #f0ece4;
  font-family: 'DM Mono', monospace;
}

.cash-input-wrap {
  position: relative;
}

.cash-currency-prefix {
  position: absolute;
  left: .75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #c8a96e;
  font-family: 'DM Mono', monospace;
  font-size: .875rem;
  pointer-events: none;
}

.cash-input {
  padding-left: 2rem !important;
  font-size: 1rem !important;
  font-family: 'DM Mono', monospace !important;
}

.quick-amounts {
  display: grid;
  gap: 5px;
}

.quick-label {
  font-size: .6875rem;
  color: #7a7590;
  text-transform: uppercase;
  letter-spacing: .07em;
  font-family: 'DM Mono', monospace;
}

.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.quick-btn {
  padding: 6px 10px;
  border-radius: 3px;
  font-size: .8125rem;
  font-family: 'DM Mono', monospace;
  border: 1px solid rgba(200, 169, 110, 0.14);
  background: rgba(200, 169, 110, 0.04);
  color: #c8a96e;
  cursor: pointer;
  transition: background .1s, border-color .1s;
}

.quick-btn:hover {
  background: rgba(200, 169, 110, 0.1);
  border-color: rgba(200, 169, 110, 0.28);
}

.quick-btn.active {
  background: rgba(200, 169, 110, 0.16);
  border-color: rgba(200, 169, 110, 0.42);
}

.cash-result-box {
  border-radius: 3px;
  padding: 10px 14px;
  display: grid;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color .15s, background .15s;
}

.cash-result-box.cash-ok {
  border-color: rgba(76, 175, 125, 0.25);
  background: rgba(76, 175, 125, 0.05);
}

.cash-result-box.cash-short {
  border-color: rgba(232, 96, 122, 0.22);
  background: rgba(232, 96, 122, 0.05);
}

.cash-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: .875rem;
}

.cash-result-row span {
  color: #7a7590;
}

.cash-result-row strong {
  color: #f0ece4;
  font-family: 'DM Mono', monospace;
}

.cash-result-divider {
  height: 1px;
  background: rgba(200, 169, 110, 0.1);
}

.change-row span {
  color: #f0ece4;
  font-weight: 500;
}

.change-amount {
  font-size: 1rem !important;
  font-weight: 600 !important;
}

.cash-ok .change-amount {
  color: #4caf7d !important;
}

.cash-short .change-amount {
  color: #e8607a !important;
}

.cash-warning {
  border-radius: 3px;
  padding: 7px 11px;
  font-size: .8125rem;
  color: #e8607a;
  background: rgba(232, 96, 122, 0.08);
  border: 1px solid rgba(232, 96, 122, 0.22);
}

.denominations {
  font-size: .8125rem;
  color: #7a7590;
}

.denominations summary {
  cursor: pointer;
  color: #7a7590;
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  font-family: 'DM Mono', monospace;
  padding: 3px 0;
  user-select: none;
}

.denominations summary:hover {
  color: #c8a96e;
}

.denom-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 7px;
}

.denom-chip {
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid rgba(200, 169, 110, 0.14);
  background: rgba(200, 169, 110, 0.04);
  color: #c8a96e;
  font-size: .75rem;
  font-family: 'DM Mono', monospace;
}

/* ── Pill ── */
.pill {
  display: inline-block;
  padding: .25rem .625rem;
  border-radius: 3px;
  font-size: .75rem;
  font-weight: 500;
  background: rgba(200, 169, 110, 0.1);
  color: #c8a96e;
  border: 1px solid rgba(200, 169, 110, 0.2);
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .nav-sidebar {
    display: none;
  }

  .booking-grid {
    grid-template-columns: 1fr;
  }

  .checkout-card {
    position: static;
  }

  .payment-grid {
    grid-template-columns: 1fr;
  }

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

  .filters-card {
    flex-direction: column;
  }

  .search-wrap,
  .date-wrap {
    width: 100%;
  }
}
</style>