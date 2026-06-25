<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Reporte de reservas</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
          <button class="ghost-button" type="button" @click="exportCsv">Exportar CSV</button>
        </div>
      </div>

      <div class="table-card card">
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useReservationsStore } from "../../stores/reservations";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import { storeToRefs } from "pinia";

const router = useRouter();
const reservationsStore = useReservationsStore();
const { reservations } = storeToRefs(reservationsStore);
const { movieFor } = useCatalogHelpers();
const { money } = useFormat();

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
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.table-card { overflow: auto; }
table { width: 100%; border-collapse: collapse; min-width: 700px; }
th, td { text-align: left; padding: .875rem 1rem; border-bottom: 1px solid rgba(200,169,110,.09); color: #d0ccde; vertical-align: top; font-size: .875rem; }
th { color: #c8a96e; font-size: .6875rem; text-transform: uppercase; font-family: "DM Mono", monospace; letter-spacing: .07em; background: rgba(200,169,110,0.03); }
tr:hover td { background: rgba(200,169,110,0.03); }
small { display: block; margin-top: 3px; font-size: .8125rem; color: #7a7590; }
@media (max-width: 900px) {
  .section-header { align-items: stretch; flex-direction: column; }
}
</style>
