<template>
    <section class="page">
        <div class="page-inner">
            <div class="section-header">
                <div>
                    <p class="eyebrow">Panel de administrador</p>
                    <h1>Historial de pagos</h1>
                </div>
                <div class="header-actions">
                    <button class="ghost-button" type="button" @click="router.push('/admin')">
                        <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
                    </button>
                </div>
            </div>
            <div class="filters card">
                <label class="field">
                    Cliente
                    <input v-model.trim="filters.cliente" class="input" placeholder="Nombre o correo..." />
                </label>
                <label class="field">
                    Estado
                    <select v-model="filters.estado" class="input">
                        <option :value="undefined">Todos</option>
                        <option value="completado">Completado</option>
                        <option value="reembolsado">Reembolsado</option>
                    </select>
                </label>
                <label class="field">
                    Método
                    <select v-model="filters.metodo" class="input">
                        <option :value="undefined">Todos</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="efectivo">Efectivo</option>
                    </select>
                </label>
                <label class="field">
                    Desde
                    <input v-model="filters.fecha_inicio" class="input" type="date" min="2000-01-01" :max="todayStr" />
                </label>
                <label class="field">
                    Hasta
                    <input v-model="filters.fecha_fin" class="input" type="date" min="2000-01-01" :max="todayStr" />
                </label>
                <button class="primary-button" type="button" @click="applyFilters" :disabled="loading">
                    {{ loading ? "Buscando..." : "Filtrar" }}
                </button>
                <button class="ghost-button" type="button" @click="clearFilters" :disabled="loading">Limpiar</button>
            </div>

            <p v-if="validationError" class="error-text">{{ validationError }}</p>
            <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
            <div class="table-card card">
                <table>
                    <thead>
                        <tr>
                            <th>Reserva</th>
                            <th>Cliente</th>
                            <th>Método</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Reembolso</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="pago in pagos" :key="pago.id">
                            <td>{{ pago.reserva.numero_reserva }}</td>
                            <td>{{ pago.reserva.usuario.nombre }}<small>{{ pago.reserva.usuario.email }}</small></td>
                            <td>{{ pago.metodo }}</td>
                            <td>L. {{ pago.monto_final }}<small v-if="Number(pago.monto_descuento) > 0">Descuento: L. {{
                                pago.monto_descuento }}</small></td>
                            <td><span class="pill" :class="'estado-' + pago.estado">{{ pago.estado }}</span></td>
                            <td>
                                <span v-if="pago.reembolso">L. {{ pago.reembolso.monto }} ({{ pago.reembolso.estado
                                    }})</span>
                                <span v-else class="muted-text">—</span>
                            </td>
                            <td>{{ formatDate(pago.created_at) }}</td>
                        </tr>
                        <tr v-if="pagos.length === 0 && !loading">
                            <td colspan="7" class="empty-text">No se encontraron pagos con esos filtros.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div v-if="totalPaginas > 1" class="pagination">
                <button class="ghost-button" type="button" :disabled="pagina <= 1 || loading"
                    @click="goToPage(pagina - 1)">Anterior</button>
                <span>Página {{ pagina }} de {{ totalPaginas }}</span>
                <button class="ghost-button" type="button" :disabled="pagina >= totalPaginas || loading"
                    @click="goToPage(pagina + 1)">Siguiente</button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { pagosService, type PagoHistorial } from "../../services/pagos.service";

const router = useRouter();
const loading = ref(false);
const errorMessage = ref("");
const validationError = ref("");
const pagos = ref<PagoHistorial[]>([]);
const pagina = ref(1);
const totalPaginas = ref(1);
const limite = 10;
const todayStr = new Date().toISOString().split("T")[0];

const filters = reactive<{
    estado?: string;
    metodo?: string;
    cliente?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    numero_reserva?: string;
}>({});

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("es-HN", { dateStyle: "short", timeStyle: "short" });
}

function isValidDate(value: string | undefined): boolean {
    if (!value) return true;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) return false;
    const [year] = value.split("-").map(Number);
    const date = new Date(value);
    return !isNaN(date.getTime());
}

function validateFilters(): boolean {
    validationError.value = "";

    if (filters.fecha_inicio && !isValidDate(filters.fecha_inicio)) {
        validationError.value = "La fecha de inicio no es válida.";
        return false;
    }

    if (filters.fecha_fin && !isValidDate(filters.fecha_fin)) {
        validationError.value = "La fecha final no es válida.";
        return false;
    }

    if (filters.fecha_inicio && filters.fecha_fin) {
        if (new Date(filters.fecha_inicio) > new Date(filters.fecha_fin)) {
            validationError.value = "La fecha de inicio no puede ser mayor que la fecha final.";
            return false;
        }
    }

    if (filters.cliente && filters.cliente.length < 2) {
        validationError.value = "Ingresa al menos 2 caracteres para buscar por cliente.";
        return false;
    }

    return true;
}

async function loadHistorial(page = 1) {
    loading.value = true;
    errorMessage.value = "";
    try {
        const response = await pagosService.getHistorial({
            ...filters,
            pagina: page,
            limite,
        });
        pagos.value = response.data;
        pagina.value = response.pagina;
        totalPaginas.value = response.total_paginas;
    } catch (err) {
        const apiErr = err as { status?: number; message?: string };
        if (apiErr.status === 400) {
            errorMessage.value = apiErr.message ?? "Los filtros ingresados no son válidos.";
        } else if (apiErr.status === 403) {
            errorMessage.value = "No tienes permisos para ver este historial.";
        } else {
            errorMessage.value = "No se pudo cargar el historial. Intenta de nuevo.";
        }
    } finally {
        loading.value = false;
    }
}

function applyFilters() {
    validationError.value = "";
    if (!validateFilters()) return;
    loadHistorial(1);
}

function clearFilters() {
    validationError.value = "";
    filters.cliente = undefined;
    filters.estado = undefined;
    filters.metodo = undefined;
    filters.fecha_inicio = undefined;
    filters.fecha_fin = undefined;
    loadHistorial(1);
}

function goToPage(page: number) {
    loadHistorial(page);
}

onMounted(() => {
    loadHistorial(1);
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

.header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    padding: 1rem 1.125rem;
    margin-bottom: 14px;
}

.field {
    display: grid;
    gap: 6px;
    color: #c8a96e;
    font-size: .8125rem;
    font-weight: 500;
    min-width: 160px;
}

.table-card {
    overflow: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
}

th,
td {
    text-align: left;
    padding: .875rem 1rem;
    border-bottom: 1px solid rgba(200, 169, 110, .09);
    color: #d0ccde;
    vertical-align: top;
    font-size: .875rem;
}

th {
    color: #c8a96e;
    font-size: .6875rem;
    text-transform: uppercase;
    font-family: "DM Mono", monospace;
    letter-spacing: .07em;
    background: rgba(200, 169, 110, 0.03);
}

tr:hover td {
    background: rgba(200, 169, 110, 0.03);
}

small {
    display: block;
    margin-top: 3px;
    font-size: .8125rem;
    color: #7a7590;
}

.muted-text {
    color: #7a7590;
}

.estado-completado {
    background: rgba(76, 175, 125, 0.08);
    border-color: rgba(76, 175, 125, 0.2);
    color: #4caf7d;
}

.estado-reembolsado {
    background: rgba(232, 96, 122, 0.08);
    border-color: rgba(232, 96, 122, 0.2);
    color: #e8607a;
}

.error-text {
    color: #e57373;
    font-size: 13px;
    margin: 0 0 10px;
}

.empty-text {
    text-align: center;
    color: #7a7590;
    padding: 2rem;
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    margin-top: 14px;
    color: #d0ccde;
    font-size: .875rem;
}

@media (max-width: 900px) {
    .section-header {
        align-items: stretch;
        flex-direction: column;
    }

    .filters {
        flex-direction: column;
        align-items: stretch;
    }
}
</style>