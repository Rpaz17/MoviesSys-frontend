<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Ciudades</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <div class="stack">
        <form class="card inline-form" @submit.prevent="saveCity">
          <input v-model.trim="cityName" class="input" placeholder="Nueva ciudad" required />
          <button class="primary-button" type="submit">Agregar</button>
        </form>
        <article v-for="city in catalog.cities" :key="city.id" class="card list-row">
          <strong>{{ city.name }}</strong>
          <button class="ghost-button" type="button" @click="city.active = !city.active">{{ city.active ? "Activa" : "Inactiva" }}</button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";

const router = useRouter();
const catalog = useCatalogStore();
const cityName = ref("");

function saveCity() {
  catalog.cities.unshift({ id: `CT${String(catalog.cities.length + 1).padStart(3, "0")}`, name: cityName.value, active: true });
  cityName.value = "";
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.stack { display: grid; gap: 10px; }
.list-row, .inline-form { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.list-row, .inline-form { padding: 1rem 1.125rem; }
.inline-form { justify-content: flex-start; }
.inline-form .input { max-width: 340px; }
strong { color: #f0ece4; }
@media (max-width: 900px) {
  .section-header, .list-row { align-items: stretch; flex-direction: column; }
}
</style>
