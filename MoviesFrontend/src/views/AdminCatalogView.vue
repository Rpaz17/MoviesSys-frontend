<template>
  <section class="page">
    <div class="page-inner">
    <div class="section-header">
      <div>
        <p class="eyebrow">Panel de administrador</p>
        <h1>{{ title }}</h1>
      </div>
      <div class="header-actions">
        <button v-if="mode === 'movies'" class="primary-button" type="button" @click="go('/admin/peliculas/crear')">Nueva película</button>
        <button v-if="mode === 'cinemas'" class="primary-button" type="button" @click="go('/admin/cines/crear')">Nuevo cine</button>
        <button v-if="mode === 'rooms'" class="primary-button" type="button" @click="go('/admin/salas/crear')">Nueva sala</button>
        <button v-if="mode === 'showtimes'" class="primary-button" type="button" @click="resetShowtime">Nueva función</button>
        <button v-if="mode === 'reports'" class="ghost-button" type="button" @click="exportCsv">Exportar CSV</button>
      </div>
    </div>

    <div v-if="mode === 'customers'" class="table-card card">
      <table>
        <thead><tr><th>Cliente</th><th>Correo</th><th>Estado</th><th>Reservas</th><th>Gastado</th></tr></thead>
        <tbody>
          <tr v-for="customer in catalog.customers" :key="customer.id">
            <td><strong>{{ customer.name }}</strong><small>{{ customer.phone }}</small></td>
            <td>{{ customer.email }}</td>
            <td><span class="pill status">{{ customer.status }}</span></td>
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
          <div class="row-between">
            <span>{{ movie.reservations }} reservas</span>
            <button class="ghost-button" type="button" @click="loadMovie(movie.id)">Editar</button>
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
      </div>
      <div class="room-picker">
        <span>Salas asignadas</span>
        <label v-for="room in catalog.rooms" :key="room.id" class="check-row">
          <input v-model="movieRoomIds" type="checkbox" :value="room.id" />
          {{ room.cinema }} · {{ room.name }} · {{ room.type }}
        </label>
      </div>
      <div class="form-actions">
        <button class="ghost-button" type="button" @click="go('/admin/peliculas')">Cancelar</button>
        <button class="primary-button" type="submit">Guardar película</button>
      </div>
    </form>

    <div v-else-if="mode === 'cinemas'" class="grid-list">
      <article v-for="cinema in catalog.cinemas" :key="cinema.id" class="card catalog-card">
        <img :src="imageUrl(cinema.img)" :alt="cinema.name" />
        <div class="card-body">
          <span class="pill">{{ cinema.status }}</span>
          <h2>{{ cinema.name }}</h2>
          <p>{{ cinema.city }} · {{ cinema.address }}</p>
          <p>{{ cinema.rooms }} salas · {{ cinema.functions }} funciones</p>
        </div>
      </article>
    </div>

    <form v-else-if="mode === 'createCinema'" class="card form-card" @submit.prevent="saveCinema">
      <div class="form-grid">
        <label class="field">Nombre<input v-model="cinemaForm.name" class="input" required /></label>
        <label class="field">Ciudad<select v-model="cinemaForm.city" class="input" required><option v-for="city in catalog.cities" :key="city.id" :value="city.name">{{ city.name }}</option></select></label>
        <label class="field wide">Dirección<input v-model="cinemaForm.address" class="input" required /></label>
      </div>
      <div class="form-actions">
        <button class="ghost-button" type="button" @click="go('/admin/cines')">Cancelar</button>
        <button class="primary-button" type="submit">Guardar cine</button>
      </div>
    </form>

    <div v-else-if="mode === 'rooms'" class="table-card card">
      <table>
        <thead><tr><th>Sala</th><th>Cine</th><th>Tipo</th><th>Capacidad</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-for="room in catalog.rooms" :key="room.id">
            <td><strong>{{ room.name }}</strong></td>
            <td>{{ room.cinema }}</td>
            <td>{{ room.type }}</td>
            <td>{{ room.rows * room.cols }} asientos</td>
            <td><span class="pill status">{{ room.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <form v-else-if="mode === 'createRoom'" class="card form-card" @submit.prevent="saveRoom">
      <div class="form-grid">
        <label class="field">Nombre<input v-model="roomForm.name" class="input" required /></label>
        <label class="field">Cine<select v-model="roomForm.cinemaId" class="input" required><option v-for="cinema in catalog.cinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option></select></label>
        <label class="field">Tipo<select v-model="roomForm.type" class="input"><option>2D</option><option>3D</option><option>IMAX</option><option>VIP</option></select></label>
        <label class="field">Filas<input v-model.number="roomForm.rows" class="input" type="number" min="1" required /></label>
        <label class="field">Columnas<input v-model.number="roomForm.cols" class="input" type="number" min="1" required /></label>
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
            <button class="danger-button" type="button" @click="catalog.cancelShowtime(showtime.id)">Cancelar</button>
          </div>
        </article>
      </div>
    </div>

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
    </div><!-- /page-inner -->
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCatalogStore } from "../stores/catalog";
import { useReservationsStore } from "../stores/reservations";
import type { CatalogMovie, Cinema, Coupon, Room, Showtime } from "../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const { reservations, coupons } = storeToRefs(reservationsStore);

const mode = computed(() => String(route.meta.mode ?? "movies"));
const title = computed(() => ({
  customers: "Clientes",
  movies: "Películas",
  createMovie: "Crear película",
  editMovie: "Editar película",
  cinemas: "Cines",
  createCinema: "Crear cine",
  rooms: "Salas",
  createRoom: "Crear sala",
  cities: "Ciudades",
  showtimes: "Funciones",
  reports: "Reporte de reservas",
  coupons: "Cupones",
  cancellations: "Configuración de cancelación",
}[mode.value] ?? "Administración"));

const movieForm = reactive<CatalogMovie>({ id: "", title: "", genre: "", language: "", rating: "", duration: "", releaseDate: "", director: "", status: "en-cartelera", reservations: 0, revenue: "$0", img: "photo-1489599849927-2ee91cede3ba" });
const movieRoomIds = ref<string[]>([]);
const cinemaForm = reactive({ name: "", city: "", address: "" });
const roomForm = reactive({ name: "", cinemaId: "", type: "2D" as Room["type"], rows: 8, cols: 10 });
const cityName = ref("");
const editingShowtimeId = ref("");
const showtimeForm = reactive<Omit<Showtime, "id" | "reservations" | "revenue" | "status">>({ movieId: "", cinemaId: "", roomId: "", date: new Date().toISOString().slice(0, 10), time: "18:00", format: "2D" });
const couponForm = reactive<Omit<Coupon, "id" | "active" | "uses">>({ code: "", type: "porcentaje", value: 10, expiresAt: "2026-12-31" });
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
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;
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

function money(value: number) {
  return new Intl.NumberFormat("es-HN", { style: "currency", currency: "USD" }).format(value);
}

function loadMovie(id: string) {
  const movie = catalog.movieById(id);
  if (!movie) return;
  Object.assign(movieForm, movie);
  movieRoomIds.value = catalog.rooms.filter((room) => room.status === "activo").slice(0, 2).map((room) => room.id);
  router.push("/admin/peliculas/editar");
}

function saveMovie() {
  const next = { ...movieForm, id: movieForm.id || `M${String(catalog.movies.length + 1).padStart(3, "0")}` };
  const index = catalog.movies.findIndex((movie) => movie.id === next.id);
  if (index >= 0) catalog.movies[index] = next;
  else catalog.movies.unshift(next);
  router.push("/admin/peliculas");
}

function saveCinema() {
  const cinema: Cinema = {
    id: `CI${String(catalog.cinemas.length + 1).padStart(3, "0")}`,
    name: cinemaForm.name,
    city: cinemaForm.city,
    address: cinemaForm.address,
    status: "activo",
    rooms: 0,
    functions: 0,
    revenue: "$0",
    img: "photo-1517604931442-7e0c8ed2963c",
  };
  catalog.cinemas.unshift(cinema);
  router.push("/admin/cines");
}

function saveRoom() {
  const cinema = catalog.cinemaById(roomForm.cinemaId);
  if (!cinema) return;
  catalog.rooms.unshift({
    id: `S${String(catalog.rooms.length + 1).padStart(3, "0")}`,
    name: roomForm.name,
    cinemaId: cinema.id,
    cinema: cinema.name,
    type: roomForm.type,
    rows: roomForm.rows,
    cols: roomForm.cols,
    status: "activo",
    functions: 0,
    occupancy: 0,
  });
  router.push("/admin/salas");
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
  editingShowtimeId.value = showtime.id;
  Object.assign(showtimeForm, {
    movieId: showtime.movieId,
    cinemaId: showtime.cinemaId,
    roomId: showtime.roomId,
    date: showtime.date,
    time: showtime.time,
    format: showtime.format,
  });
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
@media (max-width: 900px) {
  .section-header, .list-row, .form-actions { align-items: stretch; flex-direction: column; }
  .admin-split, .form-grid { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
}
</style>
