import { z } from "zod";
import { apiClient } from "../lib/api-client";

// ── Zod schemas ────────────────────────────────────────────────────────────────

const salaDisponibilidadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string(),
  filas: z.number(),
  columnas: z.number(),
});

const disponibilidadSchema = z.object({
  total: z.number(),
  disponibles: z.number(),
  ocupados: z.number(),
  porcentaje_disponibilidad: z.number(),
});

export const funcionDisponibilidadSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fecha_hora: z.string(),
  sala: salaDisponibilidadSchema,
  disponibilidad: disponibilidadSchema,
});
export type FuncionDisponibilidad = z.infer<typeof funcionDisponibilidadSchema>;

export const asientoSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fila: z.number().optional(),
  columna: z.number().optional(),
  estado: z.string().optional(),
  id_asiento: z.union([z.string(), z.number()]).optional(),
  id_funcion: z.union([z.string(), z.number()]).optional(),
});
export type Asiento = z.infer<typeof asientoSchema>;

export const createFuncionInputSchema = z.object({
  id_pelicula: z.string(),
  id_sala: z.string(),
  fecha_hora: z.string(),
});
export type CreateFuncionInput = z.infer<typeof createFuncionInputSchema>;

export const updateFuncionInputSchema = z.object({
  id_pelicula: z.string().optional(),
  id_sala: z.string().optional(),
  fecha_hora: z.string().optional(),
});
export type UpdateFuncionInput = z.infer<typeof updateFuncionInputSchema>;

export const bloquearAsientoInputSchema = z.object({
  id_asiento: z.string(),
});
export type BloquearAsientoInput = z.infer<typeof bloquearAsientoInputSchema>;

export const bloqueoResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  id_asiento: z.string(),
  id_funcion: z.union([z.string(), z.number()]),
  estado: z.string(),
});

// ── Service ────────────────────────────────────────────────────────────────────

export const funcionesService = {
  async getFuncionesDisponibilidad(
    peliculaId: number | string,
    cineId: number | string,
  ): Promise<FuncionDisponibilidad[]> {
    const { data } = await apiClient.get(
      `/funciones/${peliculaId}/cines/${cineId}/funciones`,
    );
    return z.array(funcionDisponibilidadSchema).parse(data);
  },

  async getAsientos(funcionId: number | string): Promise<Asiento[]> {
    const { data } = await apiClient.get(`/funciones/${funcionId}/asientos`);
    // API returns an object like { "A": [...seats], "B": [...seats] }
    if (typeof data === "object" && !Array.isArray(data) && data !== null) {
      const result: Asiento[] = [];
      for (const [rowKey, seats] of Object.entries(data)) {
        const fila = rowKey.trim().charCodeAt(0) - 64;
        if (!Array.isArray(seats)) continue;
        seats.forEach((seat: any, index: number) => {
          result.push({
            id: String(seat.id ?? ""),
            fila,
            columna: seat.columna ?? index + 1,
            estado: seat.estado ?? "disponible",
            id_asiento: String(seat.id_asiento ?? seat.id ?? ""),
            id_funcion: String(seat.id_funcion ?? funcionId),
          });
        });
      }
      return result;
    }
    return z.array(asientoSchema).parse(data);
  },

  async bloquearAsiento(
    funcionId: number | string,
    payload: BloquearAsientoInput,
  ): Promise<z.infer<typeof bloqueoResponseSchema> | true> {
    const { data } = await apiClient.post(
      `/funciones/${funcionId}/asientos/bloquear`,
      payload,
    );
    const parsed = bloqueoResponseSchema.safeParse(data);
    if (parsed.success) return parsed.data;
    return true; // 2xx but unexpected shape — still a success
  },

  async create(payload: CreateFuncionInput): Promise<{ id: number | string }> {
    const { data } = await apiClient.post("/funciones", payload);
    return z.object({ id: z.union([z.string(), z.number()]) }).parse(data);
  },

  async edit(
    id: number | string,
    payload: UpdateFuncionInput,
  ): Promise<{ id: number | string }> {
    const { data } = await apiClient.put(`/funciones/${id}`, payload);
    return z.object({ id: z.union([z.string(), z.number()]) }).parse(data);
  },

  async cancel(id: number | string): Promise<void> {
    await apiClient.patch(`/funciones/${id}/cancelar`);
  },
};
