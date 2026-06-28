<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>{{ isEdit ? "Editar cine" : "Crear cine" }}</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <form class="card form-card" @submit.prevent="saveCinema">
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

        <div v-if="isEdit && activeFunctionsCount > 0" class="warning-box" role="alert">
          <strong>Advertencia</strong>
          <p>
            Este cine tiene {{ activeFunctionsCount }}
            {{ activeFunctionsCount === 1 ? "función activa" : "funciones activas" }}.
            Confirma que deseas guardar los cambios antes de continuar.
          </p>
        </div>

        <div class="form-grid">
          <label class="field">
            Nombre
            <input v-model="cinemaForm.name" class="input" required :disabled="loading || saving" />
          </label>
          <label class="field">
            Ciudad
            <select v-model="cinemaForm.cityId" class="input" required :disabled="loading || saving">
              <option value="" disabled>Selecciona una ciudad</option>
              <option v-for="city in catalog.cities" :key="city.id" :value="city.id">
                {{ city.name }}
              </option>
            </select>
          </label>
          <label class="field wide">
            Dirección
            <input v-model="cinemaForm.address" class="input" required :disabled="loading || saving" />
          </label>
        </div>

        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin/cines')">
            Cancelar
          </button>
          <button class="primary-button" type="submit" :disabled="loading || saving">
            {{ submitLabel }}
          </button>
        </div>
      </form>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="showEditWarning" class="modal-backdrop" @click.self="closeEditWarning">
      <section class="edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-warning-title">
        <button class="modal-close" type="button" aria-label="Cerrar" :disabled="saving" @click="closeEditWarning">
          <X class="w-4 h-4" />
        </button>

        <div class="modal-icon">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <p class="modal-eyebrow">Confirmar modificación</p>
        <h2 id="edit-warning-title">Este cine tiene actividad programada</h2>
        <p class="modal-description">
          Los cambios en <strong>{{ cinemaForm.name }}</strong> también se verán reflejados donde se muestre la
          información del cine.
        </p>

        <div class="impact-box">
          <span><strong>{{ activeFunctionsCount }}</strong> funciones activas</span>
          <span><strong>{{ associatedRoomsCount }}</strong> salas asociadas</span>
        </div>

        <p class="warning-text">
          Las funciones y reservaciones existentes no se eliminarán. Revisa que el nuevo nombre, ciudad y dirección
          sean correctos antes de continuar.
        </p>

        <div class="modal-actions">
          <button class="ghost-button" type="button" :disabled="saving" @click="closeEditWarning">
            Revisar cambios
          </button>
          <button class="primary-button" type="button" :disabled="saving" @click="confirmEdit">
            {{ saving ? "Guardando..." : "Confirmar y guardar" }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { AlertTriangle, LayoutDashboard, X } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { cinesService } from "../../services/cines.service";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();

const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const showEditWarning = ref(false);

const editingCinemaId = computed(() =>
  route.params.id ? String(route.params.id) : "",
);
const isEdit = computed(() => Boolean(editingCinemaId.value));

const cinemaForm = reactive({
  name: "",
  cityId: "" as string | number,
  address: "",
});

const activeFunctionsCount = computed(() =>
  catalog.showtimes.filter(
    (showtime) =>
      showtime.cinemaId === editingCinemaId.value &&
      showtime.status === "activo",
  ).length,
);

const associatedRoomsCount = computed(() => new Set(
  catalog.showtimes
    .filter((showtime) => showtime.cinemaId === editingCinemaId.value)
    .map((showtime) => showtime.roomId),
).size);

const submitLabel = computed(() => {
  if (loading.value) return "Cargando...";
  if (saving.value) return "Guardando...";
  return isEdit.value ? "Guardar cambios" : "Crear cine";
});

async function loadForm() {
  loading.value = true;
  errorMessage.value = "";

  try {
    await catalog.loadFromAPI();

    if (isEdit.value) {
      const cinema = await cinesService.getById(editingCinemaId.value);
      cinemaForm.name = cinema.nombre;
      cinemaForm.address = cinema.direccion ?? "";
      cinemaForm.cityId = cinema.id_ciudad ?? "";
    }

    await catalog.loadAllShowtimes();
  } catch (err) {
    const apiErr = err as { status?: number };
    errorMessage.value = apiErr.status === 404
      ? "El cine que intentas modificar no existe."
      : "No se pudo cargar la información del cine.";
  } finally {
    loading.value = false;
  }
}

async function saveCinema() {
  if (!cinemaForm.name.trim() || !cinemaForm.cityId || !cinemaForm.address.trim()) {
    errorMessage.value = "Completa todos los campos.";
    return;
  }

  if (isEdit.value && activeFunctionsCount.value > 0) {
    showEditWarning.value = true;
    return;
  }

  await persistCinema();
}

function closeEditWarning() {
  if (!saving.value) showEditWarning.value = false;
}

async function confirmEdit() {
  await persistCinema();
}

async function persistCinema() {

  saving.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      nombre: cinemaForm.name.trim(),
      direccion: cinemaForm.address.trim(),
      id_ciudad: Number(cinemaForm.cityId),
    };

    if (isEdit.value) {
      await catalog.updateCine(editingCinemaId.value, payload);
    } else {
      await catalog.createCine(payload);
    }

    showEditWarning.value = false;
    router.push("/admin/cines");
  } catch (err) {
    const apiErr = err as { status?: number; data?: { message?: string } };

    if (apiErr.status === 409) {
      errorMessage.value = apiErr.data?.message
        ?? "Ya existe un cine con ese nombre en esta ciudad.";
    } else if (apiErr.status === 404) {
      errorMessage.value = isEdit.value
        ? "El cine que intentas modificar ya no existe."
        : "La ciudad seleccionada no fue encontrada.";
    } else if (apiErr.status === 400) {
      errorMessage.value = apiErr.data?.message
        ?? "Los datos ingresados no son válidos.";
    } else {
      errorMessage.value = "No se pudo guardar el cine. Intenta de nuevo.";
    }
  } finally {
    saving.value = false;
  }
}

onMounted(loadForm);
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-end;
  margin-bottom: 20px;
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
  font-size: clamp(20px, 2.5vw, 30px);
  font-weight: 600;
  color: #f0ece4;
  margin: 0;
  font-family: "Playfair Display", serif;
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-card {
  padding: 1.5rem;
  display: grid;
  gap: 1.125rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  color: #c8a96e;
  font-size: .8125rem;
  font-weight: 500;
}

.wide {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.error-text {
  color: #e57373;
  font-size: 13px;
  margin: 0;
}

.warning-box {
  padding: 14px 16px;
  border: 1px solid rgba(245, 158, 11, 0.45);
  border-radius: 10px;
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
}

.warning-box strong {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.warning-box p {
  margin: 0;
  color: #d6c9a8;
  font-size: 13px;
  line-height: 1.5;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(4, 6, 12, 0.78);
  backdrop-filter: blur(7px);
  animation: fade-in .16s ease-out;
}

.edit-modal {
  position: relative;
  width: min(100%, 480px);
  padding: 28px;
  border: 1px solid rgba(200, 169, 110, 0.25);
  border-radius: 18px;
  background: linear-gradient(145deg, #171725, #101019);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
  animation: modal-in .18s ease-out;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.04);
  color: #8a8797;
  cursor: pointer;
}

.modal-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 18px;
  border-radius: 14px;
  background: rgba(245, 158, 11, 0.13);
  color: #f2b84b;
}

.modal-eyebrow {
  margin: 0 0 6px;
  color: #c8a96e;
  font-family: "DM Mono", monospace;
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.edit-modal h2 {
  margin: 0 0 10px;
  color: #f0ece4;
  font-family: "Playfair Display", serif;
  font-size: 24px;
}

.modal-description {
  margin: 0;
  color: #aaa6b5;
  font-size: 14px;
  line-height: 1.55;
}

.modal-description strong {
  color: #f0ece4;
}

.impact-box {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 20px;
}

.impact-box span {
  padding: 12px;
  border: 1px solid rgba(200, 169, 110, 0.15);
  border-radius: 10px;
  background: rgba(200, 169, 110, 0.06);
  color: #9691a3;
  font-size: 12px;
  text-align: center;
}

.impact-box strong {
  display: block;
  margin-bottom: 2px;
  color: #f0ece4;
  font-size: 20px;
}

.warning-text {
  margin: 14px 0 0;
  padding: 11px 12px;
  border-left: 3px solid #c8a96e;
  border-radius: 0 8px 8px 0;
  background: rgba(200, 169, 110, 0.07);
  color: #b9b2a2;
  font-size: 12px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

@keyframes fade-in {
  from { opacity: 0; }
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
}

@media (max-width: 900px) {
  .section-header,
  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .wide {
    grid-column: auto;
  }

  .edit-modal {
    padding: 24px 20px;
  }

  .impact-box {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }
}
</style>
