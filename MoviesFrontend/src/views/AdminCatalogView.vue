<template>
  <section class="page">
    <div class="page-inner">
    <div class="section-header">
      <div>
        <p class="eyebrow">Panel de administrador</p>
        <h1>{{ title }}</h1>
      </div>
      <div class="header-actions">
        <button v-if="mode !== 'dashboard'" class="ghost-button" type="button" @click="go('/admin')">
          <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
        </button>
        <button v-if="mode === 'movies'" class="primary-button" type="button" @click="go('/admin/peliculas/crear')">Nueva película</button>
        <button v-if="mode === 'cinemas'" class="primary-button" type="button" @click="go('/admin/cines/crear')">Nuevo cine</button>
        <button v-if="mode === 'rooms'" class="primary-button" type="button" @click="go('/admin/salas/crear')">Nueva sala</button>
        <button v-if="mode === 'showtimes'" class="primary-button" type="button" @click="resetShowtime">Nueva función</button>
        <button v-if="mode === 'reports'" class="ghost-button" type="button" @click="exportCsv">Exportar CSV</button>
      </div>
    </div>

    <div v-if="mode === 'dashboard'" class="dashboard-grid">
      <button class="dash-card" @click="go('/admin/clientes')">
        <Users class="dash-icon" />
        <span class="dash-label">Clientes</span>
        <span class="dash-desc">Gestionar clientes registrados</span>
      </button>
      <button class="dash-card" @click="go('/admin/peliculas')">
        <Clapperboard class="dash-icon" />
        <span class="dash-label">Películas</span>
        <span class="dash-desc">Catálogo y estados</span>
      </button>
      <button class="dash-card" @click="go('/admin/cines')">
        <Building2 class="dash-icon" />
        <span class="dash-label">Cines</span>
        <span class="dash-desc">Sucursales y estados</span>
      </button>
      <button class="dash-card" @click="go('/admin/salas')">
        <LayoutGrid class="dash-icon" />
        <span class="dash-label">Salas</span>
        <span class="dash-desc">Salas, tipos y capacidad</span>
      </button>
      <button class="dash-card" @click="go('/admin/ciudades')">
        <MapPin class="dash-icon" />
        <span class="dash-label">Ciudades</span>
        <span class="dash-desc">Activar o desactivar ciudades</span>
      </button>
      <button class="dash-card" @click="go('/admin/funciones')">
        <CalendarClock class="dash-icon" />
        <span class="dash-label">Funciones</span>
        <span class="dash-desc">Crear y gestionar funciones</span>
      </button>
      <button class="dash-card" @click="go('/recepcion/vender')">
        <Ticket class="dash-icon" />
        <span class="dash-label">Vender boletos</span>
        <span class="dash-desc">Cobrar en efectivo en taquilla</span>
      </button>
      <button class="dash-card" @click="go('/admin/reportes')">
        <BarChart3 class="dash-icon" />
        <span class="dash-label">Reportes</span>
        <span class="dash-desc">Reservas, pagos y CSV</span>
      </button>
      <button class="dash-card" @click="go('/admin/cupones')">
        <Percent class="dash-icon" />
        <span class="dash-label">Cupones</span>
        <span class="dash-desc">Crear y activar descuentos</span>
      </button>
      <button class="dash-card" @click="go('/admin/cancelaciones')">
        <Ban class="dash-icon" />
        <span class="dash-label">Cancelaciones</span>
        <span class="dash-desc">Política de reembolsos</span>
      </button>
    </div>

    <div v-if="mode === 'customers'" class="table-card card">
      <table>
        <thead><tr><th>Cliente</th><th>Correo</th><th>Estado</th><th>Reservas</th><th>Gastado</th></tr></thead>
        <tbody>
          <tr v-for="customer in catalog.customers" :key="customer.id">
            <td><strong>{{ customer.name }}</strong><small>{{ customer.phone }}</small></td>
            <td>{{ customer.email }}</td>
            <td>
              <button class="pill status-toggle" :class="'status-' + customer.status" type="button" @click="toggleCustomerStatus(customer.id)">
                {{ customer.status }}
              </button>
            </td>
            <td>{{ customer.reservations }}</td>
            <td>{{ customer.spent }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="mode === 'movies'" class="grid-list">
      <article v-for="movie in catalog.movies" :key="movie.id" class="card catalog-card">
        <img :src="imageUrl(movie.img)" :alt="movie.title" />
        <div class="card-body">
          <span class="pill">{{ movie.status }}</span>
          <h2>{{ movie.title }}</h2>
          <p>{{ movie.genre }} · {{ movie.duration }} · {{ movie.rating }}</p>
          <p>{{ movie.director }}</p>
          <p>Cines disponibles: {{ cinemasForMovie(movie.id).join(", ") || "Sin funciones activas" }}</p>
          <div class="row-between">
            <span>{{ movie.reservations }} reservas</span>
            <div class="row-actions">
              <button class="ghost-button" type="button" @click="catalog.toggleMovieStatus(movie.id)">Estado</button>
              <button class="ghost-button" type="button" @click="loadMovie(movie.id)">Editar</button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <form v-else-if="mode === 'createMovie' || mode === 'editMovie'" class="card form-card" @submit.prevent="saveMovie">
      <div class="form-grid">
        <label class="field">Título<input v-model="movieForm.title" class="input" required /></label>
        <label class="field">Género<input v-model="movieForm.genre" class="input" required /></label>
        <label class="field">Idioma<input v-model="movieForm.language" class="input" required /></label>
        <label class="field">Clasificación<input v-model="movieForm.rating" class="input" required /></label>
        <label class="field">Duración<input v-model="movieForm.duration" class="input" required /></label>
        <label class="field">Estreno<input v-model="movieForm.releaseDate" class="input" type="date" required /></label>
        <label class="field">Director<input v-model="movieForm.director" class="input" required /></label>
        <label class="field">Estado
          <select v-model="movieForm.status" class="input">
            <option value="en-cartelera">En cartelera</option>
            <option value="proximamente">Próximamente</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
        <label class="field wide">URL de imagen
          <input v-model="movieForm.img" class="input" placeholder="photo-1489599849927-2ee91cede3ba o https://..." />
        </label>
        <div class="field wide">
          <span class="sample-label">Pósters de muestra</span>
          <div class="sample-row">
            <button v-for="sample in POSTER_SAMPLES" :key="sample.url" type="button" class="sample-chip" :class="{ active: movieForm.img === sample.url }" @click="movieForm.img = sample.url">{{ sample.label }}</button>
          </div>
        </div>
        <label class="field wide">Subir archivo
          <input class="input" type="file" accept="image/*" @change="loadMovieImage" />
        </label>
      </div>
      <img v-if="movieForm.img" class="poster-preview" :src="imageUrl(movieForm.img)" :alt="movieForm.title" />
      <div class="form-actions">
        <button class="ghost-button" type="button" @click="go('/admin/peliculas')">Cancelar</button>
        <button class="primary-button" type="submit">Guardar película</button>
      </div>
    </form>

    <div v-else-if="mode === 'cinemas'" class="grid-list">
      <article v-for="cinema in catalog.cinemas" :key="cinema.id" class="card catalog-card">
        <div class="card-body">
          <span class="pill">{{ cinema.status }}</span>
          <h2>{{ cinema.name }}</h2>
          <p>{{ cinema.city }} · {{ cinema.address }}</p>
          <p>{{ cinema.rooms }} salas · {{ cinema.functions }} funciones</p>
          <button class="ghost-button" type="button" @click="loadCinema(cinema.id)">Editar</button>
        </div>
      </article>
    </div>

    <form v-else-if="mode === 'createCinema' || mode === 'editCinema'" class="card form-card" @submit.prevent="saveCinema">
      <div class="form-grid">
        <label class="field">Nombre<input v-model="cinemaForm.name" class="input" required /></label>
        <label class="field">Ciudad<select v-model="cinemaForm.city" class="input" required><option v-for="city in catalog.cities" :key="city.id" :value="city.name">{{ city.name }}</option></select></label>
        <label class="field wide">Dirección<input v-model="cinemaForm.address" class="input" required /></label>
        <label class="field">Estado<select v-model="cinemaForm.status" class="input"><option>activo</option><option>mantenimiento</option><option>inactivo</option></select></label>
      </div>
      <div class="form-actions">
        <button class="ghost-button" type="button" @click="go('/admin/cines')">Cancelar</button>
        <button class="primary-button" type="submit">Guardar cine</button>
      </div>
    </form>

    <div v-else-if="mode === 'rooms'" class="table-card card">
      <table>
        <thead><tr><th>Sala</th><th>Cine</th><th>Tipo</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr v-for="room in catalog.rooms" :key="room.id">
            <td><strong>{{ room.name }}</strong></td>
            <td>{{ room.cinema }}</td>
            <td>{{ room.type }}</td>
            <td>{{ room.rows * room.cols }} asientos</td>
            <td><span class="pill status">{{ room.status }}</span></td>
            <td><button class="ghost-button" type="button" @click="loadRoom(room.id)">Editar</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <form v-else-if="mode === 'createRoom' || mode === 'editRoom'" class="card form-card" @submit.prevent="saveRoom">
      <div class="form-grid">
        <label class="field">Nombre<input v-model="roomForm.name" class="input" required /></label>
        <template v-if="mode !== 'editRoom'">
          <label class="field">Cine<select v-model="roomForm.cinemaId" class="input" required><option v-for="cinema in catalog.cinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option></select></label>
          <label class="field">Tipo<select v-model="roomForm.type" class="input"><option>2D</option><option>3D</option><option>IMAX</option><option>VIP</option></select></label>
          <label class="field">Filas<input v-model.number="roomForm.rows" class="input" type="number" min="1" required /></label>
          <label class="field">Columnas<input v-model.number="roomForm.cols" class="input" type="number" min="1" required /></label>
        </template>
        <label class="field">Estado<select v-model="roomForm.status" class="input"><option>activo</option><option>mantenimiento</option><option>inactivo</option></select></label>
      </div>
      <div class="form-actions">
        <button class="ghost-button" type="button" @click="go('/admin/salas')">Cancelar</button>
        <button class="primary-button" type="submit">Guardar sala</button>
      </div>
    </form>

    <div v-else-if="mode === 'cities'" class="stack">
      <form class="card inline-form" @submit.prevent="saveCity">
        <input v-model.trim="cityName" class="input" placeholder="Nueva ciudad" required />
        <button class="primary-button" type="submit">Agregar ciudad</button>
      </form>
      <article v-for="city in catalog.cities" :key="city.id" class="card list-row">
        <strong>{{ city.name }}</strong>
        <button class="ghost-button" type="button" @click="city.active = !city.active">{{ city.active ? "Activa" : "Inactiva" }}</button>
      </article>
    </div>

    <div v-else-if="mode === 'showtimes'" class="admin-split">
      <form class="card form-card" @submit.prevent="saveShowtime">
        <div class="form-grid">
          <label class="field">Película<select v-model="showtimeForm.movieId" class="input" required><option v-for="movie in activeMovies" :key="movie.id" :value="movie.id">{{ movie.title }}</option></select></label>
          <label class="field">Cine<select v-model="showtimeForm.cinemaId" class="input" required><option v-for="cinema in activeCinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option></select></label>
          <label class="field">Sala<select v-model="showtimeForm.roomId" class="input" required><option v-for="room in filteredRooms" :key="room.id" :value="room.id">{{ room.name }} · {{ room.type }}</option></select></label>
          <label class="field">Fecha<input v-model="showtimeForm.date" class="input" type="date" required /></label>
          <label class="field">Hora<input v-model="showtimeForm.time" class="input" type="time" required /></label>
          <label class="field">Formato<select v-model="showtimeForm.format" class="input"><option>2D</option><option>3D</option><option>IMAX</option><option>VIP</option></select></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="resetShowtime">Limpiar</button>
          <button class="primary-button" type="submit">{{ editingShowtimeId ? "Actualizar" : "Crear" }} función</button>
        </div>
      </form>
      <div class="stack">
        <article v-for="showtime in catalog.showtimes" :key="showtime.id" class="card list-row">
          <div>
            <h2>{{ movieFor(showtime.movieId)?.title }}</h2>
            <p>{{ cinemaFor(showtime.cinemaId)?.name }} · {{ roomFor(showtime.roomId)?.name }} · {{ showtime.date }} {{ showtime.time }}</p>
          </div>
          <div class="row-actions">
            <button class="ghost-button" type="button" @click="editShowtime(showtime)">Editar</button>
            <button class="danger-button" type="button" @click="openCancelShowtime(showtime)">Cancelar</button>
          </div>
        </article>
      </div>
    </div>

    <form v-else-if="mode === 'editShowtime'" class="card form-card" @submit.prevent="saveEditedShowtime">
      <div class="form-grid">
        <label class="field">Película<select v-model="showtimeForm.movieId" class="input" required><option v-for="movie in activeMovies" :key="movie.id" :value="movie.id">{{ movie.title }}</option></select></label>
        <label class="field">Cine<select v-model="showtimeForm.cinemaId" class="input" required><option v-for="cinema in activeCinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option></select></label>
        <label class="field">Sala<select v-model="showtimeForm.roomId" class="input" required><option v-for="room in filteredRooms" :key="room.id" :value="room.id">{{ room.name }} · {{ room.type }}</option></select></label>
        <label class="field">Fecha<input v-model="showtimeForm.date" class="input" type="date" required /></label>
        <label class="field">Hora<input v-model="showtimeForm.time" class="input" type="time" required /></label>
        <label class="field">Formato<select v-model="showtimeForm.format" class="input"><option>2D</option><option>3D</option><option>IMAX</option><option>VIP</option></select></label>
        <label class="field">Estado<select v-model="showtimeForm.editingStatus" class="input"><option value="activo">Activo</option><option value="mantenimiento">Mantenimiento</option><option value="inactivo">Inactivo</option></select></label>
      </div>
      <div class="form-actions">
        <button class="ghost-button" type="button" @click="go('/admin/funciones')">Volver a funciones</button>
        <button class="primary-button" type="submit">Guardar cambios</button>
      </div>
    </form>

    <div v-else-if="mode === 'reports'" class="table-card card">
      <table>
        <thead><tr><th>Reserva</th><th>Cliente</th><th>Función</th><th>Asientos</th><th>Pago</th><th>Total</th></tr></thead>
        <tbody>
          <tr v-for="reservation in reservations" :key="reservation.id">
            <td>{{ reservation.id }}</td>
            <td>{{ reservation.customerName }}<small>{{ reservation.customerEmail }}</small></td>
            <td>{{ movieFor(reservation.movieId)?.title }}<small>{{ reservation.date }} {{ reservation.time }}</small></td>
            <td>{{ reservation.seats.join(", ") }}</td>
            <td>{{ reservation.paymentStatus }}</td>
            <td>{{ money(reservation.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="mode === 'coupons'" class="admin-split">
      <form class="card form-card" @submit.prevent="saveCoupon">
        <div class="form-grid">
          <label class="field">Código<input v-model.trim="couponForm.code" class="input" required /></label>
          <label class="field">Tipo<select v-model="couponForm.type" class="input"><option value="porcentaje">Porcentaje</option><option value="monto">Monto fijo</option></select></label>
          <label class="field">Valor<input v-model.number="couponForm.value" class="input" type="number" min="1" required /></label>
          <label class="field">Vencimiento<input v-model="couponForm.expiresAt" class="input" type="date" required /></label>
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

    <form v-else class="card form-card">
      <div class="form-grid">
        <label class="field">Reembolso completo antes de<input v-model.number="policy.fullHours" class="input" type="number" /></label>
        <label class="field">Reembolso parcial antes de<input v-model.number="policy.partialHours" class="input" type="number" /></label>
        <label class="field">Porcentaje parcial<input v-model.number="policy.partialPercent" class="input" type="number" /></label>
      </div>
      <p class="policy-box">Esta configuración alimenta la política mostrada al cliente antes de cancelar una reserva.</p>
      <button class="primary-button" type="button">Guardar política</button>
    </form>
    <div v-if="cancelShowtimeTarget" class="modal-backdrop" @click.self="cancelShowtimeTarget = null">
      <article class="modal-card">
        <h2>Cancelar función</h2>
        <p><strong>{{ movieFor(cancelShowtimeTarget.movieId)?.title }}</strong></p>
        <p>{{ cinemaFor(cancelShowtimeTarget.cinemaId)?.name }} · {{ roomFor(cancelShowtimeTarget.roomId)?.name }}</p>
        <p>{{ cancelShowtimeTarget.date }} · {{ cancelShowtimeTarget.time }} · {{ cancelShowtimeTarget.format }}</p>
        <p class="policy-box">Al cancelar esta función pasará a estado <strong>inactivo</strong>. Las reservas existentes no se eliminarán, pero la función ya no aparecerá disponible para nuevas reservas.</p>
        <div class="modal-actions">
          <button class="ghost-button" type="button" @click="cancelShowtimeTarget = null">Volver</button>
          <button class="danger-button" type="button" @click="confirmCancelShowtime">Confirmar cancelación</button>
        </div>
      </article>
    </div>
    </div><!-- /page-inner -->
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { Ban, BarChart3, Building2, CalendarClock, Clapperboard, LayoutDashboard, LayoutGrid, MapPin, Percent, Ticket, Users } from "lucide-vue-next";
import { useCatalogStore } from "../stores/catalog";
import { useReservationsStore } from "../stores/reservations";
import { POSTER_SAMPLES } from "../data/mockData";
import type { AdminStatus, CatalogMovie, Cinema, Coupon, Customer, Room, Showtime } from "../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const { reservations, coupons } = storeToRefs(reservationsStore);

const mode = computed(() => String(route.meta.mode ?? "movies"));
const title = computed(() => ({
  dashboard: "Dashboard",
  customers: "Clientes",
  movies: "Películas",
  createMovie: "Crear película",
  editMovie: "Editar película",
  cinemas: "Cines",
  createCinema: "Crear cine",
  editCinema: "Editar cine",
  rooms: "Salas",
  createRoom: "Crear sala",
  editRoom: "Editar sala",
  cities: "Ciudades",
  showtimes: "Funciones",
  editShowtime: "Editar función",
  reports: "Reporte de reservas",
  coupons: "Cupones",
  cancellations: "Configuración de cancelación",
}[mode.value] ?? "Administración"));

const movieForm = reactive<CatalogMovie>({ id: "", title: "", genre: "", language: "", rating: "", duration: "", releaseDate: "", director: "", status: "en-cartelera", reservations: 0, revenue: "$0", img: "photo-1489599849927-2ee91cede3ba" });
const editingCinemaId = ref("");
const editingRoomId = ref("");
const cinemaForm = reactive({ name: "", city: "", address: "", status: "activo" as AdminStatus });
const roomForm = reactive({ name: "", cinemaId: "", type: "2D" as Room["type"], rows: 8, cols: 10, status: "activo" as AdminStatus });
const cityName = ref("");
const editingShowtimeId = ref("");
const showtimeForm = reactive<Omit<Showtime, "id" | "reservations" | "revenue" | "status"> & { editingStatus?: AdminStatus }>({ movieId: "", cinemaId: "", roomId: "", date: new Date().toISOString().slice(0, 10), time: "18:00", format: "2D" });
const couponForm = reactive<Omit<Coupon, "id" | "active" | "uses">>({ code: "", type: "porcentaje", value: 10, expiresAt: "2026-12-31" });
const cancelShowtimeTarget = ref<Showtime | null>(null);
const policy = reactive({ fullHours: 24, partialHours: 6, partialPercent: 50 });

const activeMovies = computed(() => catalog.movies.filter((item) => item.status !== "inactivo"));
const activeCinemas = computed(() => catalog.cinemas.filter((item) => item.status === "activo"));
const filteredRooms = computed(() => catalog.rooms.filter((room) => room.cinemaId === showtimeForm.cinemaId && room.status === "activo"));

watch(() => showtimeForm.cinemaId, () => {
  if (!filteredRooms.value.some((room) => room.id === showtimeForm.roomId)) showtimeForm.roomId = filteredRooms.value[0]?.id ?? "";
});

function go(path: string) {
  router.push(path);
}

function imageUrl(id: string) {
  if (id.startsWith("data:") || id.startsWith("http")) return id;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
}

function toggleCustomerStatus(id: string) {
  const order: Customer["status"][] = ["activo", "inactivo", "suspendido"];
  const customer = catalog.customers.find((c) => c.id === id);
  if (!customer) return;
  const nextIdx = (order.indexOf(customer.status) + 1) % order.length;
  customer.status = order[nextIdx];
}

function movieFor(id: string) {
  return catalog.movieById(id);
}

function cinemaFor(id: string) {
  return catalog.cinemaById(id);
}

function roomFor(id: string) {
  return catalog.roomById(id);
}

function cinemasForMovie(movieId: string) {
  const cinemaNames = catalog.showtimes
    .filter((showtime) => showtime.movieId === movieId && showtime.status === "activo")
    .map((showtime) => cinemaFor(showtime.cinemaId)?.name)
    .filter(Boolean) as string[];
  return [...new Set(cinemaNames)];
}

function money(value: number) {
  return new Intl.NumberFormat("es-HN", { style: "currency", currency: "USD" }).format(value);
}

function loadMovie(id: string) {
  const movie = catalog.movieById(id);
  if (!movie) return;
  Object.assign(movieForm, movie);
  router.push("/admin/peliculas/editar");
}

function loadMovieImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    movieForm.img = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function saveMovie() {
  const next = { ...movieForm, id: movieForm.id || `M${String(catalog.movies.length + 1).padStart(3, "0")}` };
  const index = catalog.movies.findIndex((movie) => movie.id === next.id);
  if (index >= 0) catalog.movies[index] = next;
  else catalog.movies.unshift(next);
  router.push("/admin/peliculas");
}

function saveCinema() {
  const previous = editingCinemaId.value ? catalog.cinemaById(editingCinemaId.value) : undefined;
  const cinema: Cinema = {
    id: editingCinemaId.value || `CI${String(catalog.cinemas.length + 1).padStart(3, "0")}`,
    name: cinemaForm.name,
    city: cinemaForm.city,
    address: cinemaForm.address,
    status: cinemaForm.status,
    rooms: previous?.rooms ?? 0,
    functions: previous?.functions ?? 0,
    revenue: previous?.revenue ?? "$0",
    img: previous?.img ?? "",
  };
  catalog.upsertCinema(cinema);
  editingCinemaId.value = "";
  router.push("/admin/cines");
}

function saveRoom() {
  const cinema = catalog.cinemaById(roomForm.cinemaId);
  if (!cinema) return;
  const previous = editingRoomId.value ? catalog.roomById(editingRoomId.value) : undefined;
  catalog.upsertRoom({
    id: editingRoomId.value || `S${String(catalog.rooms.length + 1).padStart(3, "0")}`,
    name: roomForm.name,
    cinemaId: cinema.id,
    cinema: cinema.name,
    type: roomForm.type,
    rows: roomForm.rows,
    cols: roomForm.cols,
    status: roomForm.status,
    functions: previous?.functions ?? 0,
    occupancy: previous?.occupancy ?? 0,
  });
  editingRoomId.value = "";
  router.push("/admin/salas");
}

function loadCinema(id: string) {
  const cinema = catalog.cinemaById(id);
  if (!cinema) return;
  editingCinemaId.value = id;
  Object.assign(cinemaForm, {
    name: cinema.name,
    city: cinema.city,
    address: cinema.address,
    status: cinema.status,
  });
  router.push("/admin/cines/editar");
}

function loadRoom(id: string) {
  const room = catalog.roomById(id);
  if (!room) return;
  editingRoomId.value = id;
  Object.assign(roomForm, {
    name: room.name,
    cinemaId: room.cinemaId,
    type: room.type,
    rows: room.rows,
    cols: room.cols,
    status: room.status,
  });
  router.push("/admin/salas/editar");
}

function saveCity() {
  catalog.cities.unshift({ id: `CT${String(catalog.cities.length + 1).padStart(3, "0")}`, name: cityName.value, active: true });
  cityName.value = "";
}

function resetShowtime() {
  editingShowtimeId.value = "";
  showtimeForm.movieId = activeMovies.value[0]?.id ?? "";
  showtimeForm.cinemaId = activeCinemas.value[0]?.id ?? "";
  showtimeForm.roomId = filteredRooms.value[0]?.id ?? "";
  showtimeForm.date = new Date().toISOString().slice(0, 10);
  showtimeForm.time = "18:00";
  showtimeForm.format = "2D";
}

function editShowtime(showtime: Showtime) {
  router.push(`/admin/funciones/editar?id=${showtime.id}`);
}

function loadEditShowtime(id: string) {
  const showtime = catalog.showtimes.find((item) => item.id === id);
  if (!showtime) return;
  editingShowtimeId.value = showtime.id;
  showtimeForm.movieId = showtime.movieId;
  showtimeForm.cinemaId = showtime.cinemaId;
  showtimeForm.roomId = showtime.roomId;
  showtimeForm.date = showtime.date;
  showtimeForm.time = showtime.time;
  showtimeForm.format = showtime.format;
  showtimeForm.editingStatus = showtime.status;
}

function saveEditedShowtime() {
  const previous = catalog.showtimes.find((item) => item.id === editingShowtimeId.value);
  catalog.upsertShowtime({
    movieId: showtimeForm.movieId,
    cinemaId: showtimeForm.cinemaId,
    roomId: showtimeForm.roomId,
    date: showtimeForm.date,
    time: showtimeForm.time,
    format: showtimeForm.format,
    id: editingShowtimeId.value,
    status: showtimeForm.editingStatus ?? "activo",
    reservations: previous?.reservations ?? 0,
    revenue: previous?.revenue ?? "$0",
  });
  router.push("/admin/funciones");
}

function openCancelShowtime(showtime: Showtime) {
  cancelShowtimeTarget.value = showtime;
}

function confirmCancelShowtime() {
  if (!cancelShowtimeTarget.value) return;
  catalog.cancelShowtime(cancelShowtimeTarget.value.id);
  cancelShowtimeTarget.value = null;
}

function saveShowtime() {
  catalog.upsertShowtime({
    ...showtimeForm,
    id: editingShowtimeId.value || `F${String(catalog.showtimes.length + 1).padStart(3, "0")}`,
    status: "activo",
    reservations: editingShowtimeId.value ? catalog.showtimes.find((item) => item.id === editingShowtimeId.value)?.reservations ?? 0 : 0,
    revenue: editingShowtimeId.value ? catalog.showtimes.find((item) => item.id === editingShowtimeId.value)?.revenue ?? "$0" : "$0",
  });
  resetShowtime();
}

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

function exportCsv() {
  const rows = [["id", "cliente", "correo", "pelicula", "fecha", "hora", "asientos", "total"]];
  reservations.value.forEach((reservation) => rows.push([
    reservation.id,
    reservation.customerName,
    reservation.customerEmail,
    movieFor(reservation.movieId)?.title ?? "",
    reservation.date,
    reservation.time,
    reservation.seats.join(" "),
    String(reservation.total),
  ]));
  const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reporte-reservas.csv";
  link.click();
  URL.revokeObjectURL(url);
}

watch(() => route.query.id, (id) => {
  if (mode.value === "editShowtime" && id) {
    loadEditShowtime(String(id));
  }
}, { immediate: true });

resetShowtime();
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { font-size: .9375rem; font-weight: 600; color: #f0ece4; margin: 0; }
p, small { color: #7a7590; font-size: .875rem; margin: 0; }
small { display: block; margin-top: 3px; font-size: .8125rem; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.grid-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.catalog-card { overflow: hidden; padding: 0; transition: transform .15s, border-color .15s; }
.catalog-card:hover { transform: translateY(-2px); border-color: rgba(200,169,110,0.22); }
.catalog-card img { width: 100%; height: 160px; object-fit: cover; }
.poster-preview { width: min(280px, 100%); aspect-ratio: 2 / 3; object-fit: cover; border-radius: 3px; border: 1px solid rgba(200,169,110,.14); }
.card-body, .stack { display: grid; gap: 10px; }
.card-body { padding: 1rem 1.125rem; }
.table-card { overflow: auto; }
table { width: 100%; border-collapse: collapse; min-width: 700px; }
th, td { text-align: left; padding: .875rem 1rem; border-bottom: 1px solid rgba(200,169,110,.09); color: #d0ccde; vertical-align: top; font-size: .875rem; }
th { color: #c8a96e; font-size: .6875rem; text-transform: uppercase; font-family: "DM Mono", monospace; letter-spacing: .07em; background: rgba(200,169,110,0.03); }
tr:hover td { background: rgba(200,169,110,0.03); }
.form-card { padding: 1.5rem; display: grid; gap: 1.125rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.wide { grid-column: 1 / -1; }
.form-actions, .row-between, .list-row, .inline-form { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.list-row, .inline-form { padding: 1rem 1.125rem; }
.inline-form { justify-content: flex-start; }
.inline-form .input { max-width: 340px; }
.room-picker { display: grid; gap: 8px; padding: 1rem; border: 1px solid rgba(200,169,110,.1); border-radius: 4px; background: rgba(200,169,110,0.02); }
.room-picker > span { color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.check-row { display: flex; gap: 8px; align-items: center; color: #d0ccde; font-size: .875rem; }
.admin-split { display: grid; grid-template-columns: minmax(300px, 440px) 1fr; gap: 16px; align-items: start; }
.row-actions { display: flex; gap: 7px; }
.danger-button { border-radius: 3px; padding: .375rem .8125rem; font-size: .8125rem; font-weight: 500; color: #ffd8df; border: 1px solid rgba(232,96,122,.3); background: rgba(232,96,122,.08); transition: background .12s; }
.danger-button:hover { background: rgba(232,96,122,.15); }
.policy-box { border-radius: 3px; padding: .875rem; background: rgba(255,255,255,0.04); color: #7a7590; font-size: .8125rem; line-height: 1.5; }
.pill.status { background: rgba(200,169,110,.08); border: 1px solid rgba(200,169,110,.16); color: #c8a96e; }
.status-toggle { cursor: pointer; transition: background .12s, border-color .12s; }
.status-toggle:hover { opacity: .85; }
.status-activo { background: rgba(76,175,125,0.08); border-color: rgba(76,175,125,0.2); color: #4caf7d; }
.status-inactivo { background: rgba(122,117,144,0.08); border-color: rgba(122,117,144,0.2); color: #7a7590; }
.status-suspendido { background: rgba(232,96,122,0.08); border-color: rgba(232,96,122,0.2); color: #e8607a; }
.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.dash-card { display: flex; flex-direction: column; align-items: flex-start; gap: .375rem; padding: 1.25rem 1.25rem 1.125rem; border-radius: 4px; text-align: left; border: 1px solid rgba(200,169,110,0.12); background: rgba(200,169,110,0.04); transition: transform .12s, border-color .12s, background .12s; }
.dash-card:hover { transform: translateY(-1px); background: rgba(200,169,110,0.08); border-color: rgba(200,169,110,0.25); }
.dash-card:active { transform: scale(.98); }
.dash-icon { width: 1.25rem; height: 1.25rem; color: #c8a96e; margin-bottom: .25rem; }
.dash-label { font-size: .9375rem; font-weight: 600; color: #f0ece4; line-height: 1.2; }
.dash-desc { font-size: .75rem; color: #7a7590; line-height: 1.3; }
.sample-label { font-size: .75rem; color: #7a7590; }
.sample-row { display: flex; flex-wrap: wrap; gap: 6px; }
.sample-chip { font-size: .75rem; padding: .3125rem .625rem; border-radius: 3px; color: #9e9ab0; border: 1px solid rgba(200,169,110,0.14); background: rgba(255,255,255,0.02); transition: background .12s, border-color .12s, color .12s; }
.sample-chip:hover { background: rgba(200,169,110,0.08); border-color: rgba(200,169,110,0.28); color: #c8a96e; }
.sample-chip.active { background: rgba(200,169,110,0.12); border-color: rgba(200,169,110,0.35); color: #c8a96e; }
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.65); z-index: 30; backdrop-filter: blur(4px); }
.modal-card { width: min(480px, calc(100vw - 2rem)); background: #171526; border: 1px solid rgba(200,169,110,0.14); border-radius: 4px; padding: 1.5rem; display: grid; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
@media (max-width: 900px) {
  .section-header, .list-row, .form-actions { align-items: stretch; flex-direction: column; }
  .admin-split, .form-grid { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
}
</style>
