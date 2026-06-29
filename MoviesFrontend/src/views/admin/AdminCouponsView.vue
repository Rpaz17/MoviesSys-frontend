<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Cupones</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <div class="admin-split">
        <form class="card form-card" @submit.prevent="saveCoupon">
          <p v-if="formError" class="error-text">{{ formError }}</p>
          <div class="form-grid">
            <label class="field">Código<input v-model.trim="couponForm.codigo" class="input" required /></label>
            <label class="field">
              Tipo
              <select v-model="couponForm.tipo" class="input">
                <option value="porcentaje">Porcentaje</option>
                <option value="monto">Monto fijo</option>
              </select>
            </label>
            <label class="field">Valor<input v-model.number="couponForm.valor" class="input" type="number" min="1"
                required /></label>
            <label class="field">
              Expiración
              <input v-model="couponForm.fecha_expiracion" class="input" type="date" :min="todayStr" required />
            </label>
            <label class="field">Usos máximos<input v-model.number="couponForm.usos_maximos" class="input" type="number"
                min="0" /></label>
          </div>
          <button class="primary-button" type="submit" :disabled="saving">
            {{ saving ? "Guardando..." : "Crear cupón" }}
          </button>
        </form>

        <div class="stack">
          <div class="search-wrapper">
            <Search class="search-icon w-4 h-4" />
            <input v-model.trim="searchQuery" class="input search-input" type="search"
              placeholder="Buscar por código..." />
          </div>
          <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
          <p v-if="cupones.length === 0 && !loading" class="empty-text">No hay cupones registrados.</p>
          <p v-else-if="filteredCupones.length === 0" class="empty-text">No se encontraron cupones con ese código.</p>
          <article v-for="cupon in filteredCupones" :key="cupon.id" class="card list-row"
            :class="{ 'is-inactive': !cupon.activo }">
            <template v-if="editingId === cupon.id">
              <div class="edit-grid">
                <input v-model.trim="editForm.codigo" class="input" placeholder="Código" />
                <select v-model="editForm.tipo" class="input">
                  <option value="porcentaje">Porcentaje</option>
                  <option value="monto">Monto fijo</option>
                </select>
                <input v-model.number="editForm.valor" class="input" type="number" min="1" placeholder="Valor" />
                <input v-model="editForm.fecha_expiracion" class="input" type="date" :min="todayStr" />
                <input v-model.number="editForm.usos_maximos" class="input" type="number" min="0"
                  placeholder="Usos máximos" />
              </div>
              <div class="row-actions">
                <button class="ghost-button" type="button" @click="confirmEdit(cupon.id)"
                  :disabled="saving">Guardar</button>
                <button class="ghost-button" type="button" @click="cancelEdit">Cancelar</button>
              </div>
            </template>
            <template v-else>
              <div>
                <h2>{{ cupon.codigo }}</h2>
                <p>{{ cupon.tipo }} · {{ cupon.valor }} · vence {{ cupon.fecha_expiracion.slice(0, 10) }} · {{
                  cupon.usos_actuales }}/{{ cupon.usos_maximos ?? "∞" }} usos</p>
              </div>
              <div class="row-actions">
                <button v-if="cupon.activo" class="ghost-button" type="button" @click="startEdit(cupon)">Editar</button>
                <button class="ghost-button" type="button" @click="toggleStatus(cupon.id)"
                  :disabled="togglingId === cupon.id">
                  {{ togglingId === cupon.id ? "..." : cupon.activo ? "Desactivar" : "Activar" }}
                </button>
              </div>
            </template>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard, Search } from "lucide-vue-next";
import { cuponesService, type Cupon } from "../../services/cupones.service";

const router = useRouter();
const cupones = ref<Cupon[]>([]);
const loading = ref(false);
const saving = ref(false);
const togglingId = ref<string | null>(null);
const errorMessage = ref("");
const formError = ref("");
const searchQuery = ref("");
const editingId = ref<string | null>(null);

const todayStr = new Date().toISOString().split("T")[0];

const couponForm = reactive({
  codigo: "",
  tipo: "porcentaje" as "porcentaje" | "monto",
  valor: 10,
  fecha_expiracion: "",
  usos_maximos: undefined as number | undefined,
});

const editForm = reactive({
  codigo: "",
  tipo: "porcentaje" as "porcentaje" | "monto",
  valor: 0,
  fecha_expiracion: "",
  usos_maximos: undefined as number | undefined,
});

const filteredCupones = computed(() => {
  if (!searchQuery.value) return cupones.value;
  const query = searchQuery.value.toUpperCase();
  return cupones.value.filter((c) => c.codigo.includes(query));
});

async function loadCupones() {
  loading.value = true;
  errorMessage.value = "";
  try {
    cupones.value = await cuponesService.getAll();
  } catch {
    errorMessage.value = "No se pudieron cargar los cupones.";
  } finally {
    loading.value = false;
  }
}

function validateForm(form: typeof couponForm): boolean {
  formError.value = "";

  if (!form.codigo) {
    formError.value = "El código es obligatorio.";
    return false;
  }

  if (!form.valor || form.valor <= 0) {
    formError.value = "El valor debe ser mayor a 0.";
    return false;
  }

  if (form.tipo === "porcentaje" && form.valor > 100) {
    formError.value = "El porcentaje no puede ser mayor a 100.";
    return false;
  }

  if (!form.fecha_expiracion) {
    formError.value = "La fecha de expiración es obligatoria.";
    return false;
  }

  if (new Date(form.fecha_expiracion) < new Date(todayStr)) {
    formError.value = "La fecha de expiración no puede ser en el pasado.";
    return false;
  }

  return true;
}

async function saveCoupon() {
  if (!validateForm(couponForm)) return;
  saving.value = true;
  try {
    await cuponesService.create({
      codigo: couponForm.codigo.toUpperCase().trim(),
      tipo: couponForm.tipo,
      valor: couponForm.valor,
      fecha_expiracion: couponForm.fecha_expiracion,
      usos_maximos: couponForm.usos_maximos,
    });
    couponForm.codigo = "";
    couponForm.valor = 10;
    couponForm.fecha_expiracion = "";
    couponForm.usos_maximos = undefined;
    await loadCupones();
  } catch (err) {
    const apiErr = err as { status?: number };
    formError.value =
      apiErr.status === 400
        ? "Ya existe un cupón con ese código."
        : "No se pudo crear el cupón. Intenta de nuevo.";
  } finally {
    saving.value = false;
  }
}

function startEdit(cupon: Cupon) {
  editingId.value = cupon.id;
  editForm.codigo = cupon.codigo;
  editForm.tipo = cupon.tipo as "porcentaje" | "monto";
  editForm.valor = Number(cupon.valor);
  editForm.fecha_expiracion = cupon.fecha_expiracion.slice(0, 10);
  editForm.usos_maximos = cupon.usos_maximos ?? undefined;
}

function cancelEdit() {
  editingId.value = null;
}

async function confirmEdit(id: string) {
  if (!validateForm(editForm)) return;

  saving.value = true;
  try {
    await cuponesService.update(id, {
      codigo: editForm.codigo.toUpperCase().trim(),
      tipo: editForm.tipo,
      valor: editForm.valor,
      fecha_expiracion: editForm.fecha_expiracion,
      usos_maximos: editForm.usos_maximos,
    });
    editingId.value = null;
    await loadCupones();
  } catch (err) {
    const apiErr = err as { status?: number };
    errorMessage.value =
      apiErr.status === 400
        ? "Ya existe un cupón con ese código."
        : "No se pudo actualizar el cupón.";
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(id: string) {
  errorMessage.value = "";
  togglingId.value = id;
  try {
    await cuponesService.toggleStatus(id);
    await loadCupones();
  } catch {
    errorMessage.value = "No se pudo cambiar el estado del cupón.";
  } finally {
    togglingId.value = null;
  }
}

onMounted(() => {
  loadCupones();
});
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
  font-family: 'Playfair Display', serif;
  letter-spacing: -0.01em;
}

h2 {
  font-size: .9375rem;
  font-weight: 600;
  color: #f0ece4;
  margin: 0;
}

p,
span {
  color: #7a7590;
  font-size: .875rem;
  margin: 0;
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

.admin-split {
  display: grid;
  grid-template-columns: minmax(300px, 440px) 1fr;
  gap: 16px;
  align-items: start;
}

.stack {
  display: grid;
  gap: 10px;
}

.list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.125rem;
}

.is-inactive h2,
.is-inactive p {
  opacity: 0.5;
}

.error-text {
  color: #e57373;
  font-size: 13px;
  margin: 0;
}

.empty-text {
  color: #7a7590;
  font-size: 14px;
  text-align: center;
  padding: 1rem;
}

.search-wrapper {
  position: relative;
  max-width: 340px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a8378;
  pointer-events: none;
}

.search-input {
  padding-left: 36px;
}

.edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  flex: 1;
}

.row-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 900px) {

  .section-header,
  .list-row {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-split,
  .form-grid,
  .edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>