import { z } from "zod";
import { apiClient } from "../lib/api-client";

export const cuponSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  tipo: z.string(),
  valor: z.string(),
  fecha_expiracion: z.string(),
  usos_maximos: z.number().nullable(),
  usos_actuales: z.number(),
  activo: z.boolean(),
  created_at: z.string().optional(),
});
export type Cupon = z.infer<typeof cuponSchema>;

export const createCuponInputSchema = z.object({
  codigo: z.string().min(1),
  tipo: z.enum(["porcentaje", "monto"]),
  valor: z.number().positive(),
  fecha_expiracion: z.string(),
  usos_maximos: z.number().optional(),
});
export type CreateCuponInput = z.infer<typeof createCuponInputSchema>;

export const updateCuponInputSchema = z.object({
  codigo: z.string().min(1).optional(),
  tipo: z.enum(["porcentaje", "monto"]).optional(),
  valor: z.number().positive().optional(),
  fecha_expiracion: z.string().optional(),
  usos_maximos: z.number().optional(),
});
export type UpdateCuponInput = z.infer<typeof updateCuponInputSchema>;

export const cuponesService = {
  async getAll(): Promise<Cupon[]> {
    const { data } = await apiClient.get<Cupon[]>("/cupones");
    return z.array(cuponSchema).parse(data);
  },

  async create(payload: CreateCuponInput): Promise<Cupon> {
    const { data } = await apiClient.post("/cupones", payload);
    return cuponSchema.parse(data);
  },

  async update(id: string, payload: UpdateCuponInput): Promise<Cupon> {
    const { data } = await apiClient.put(`/cupones/${id}`, payload);
    return cuponSchema.parse(data);
  },

  async toggleStatus(id: string): Promise<Cupon> {
    const { data } = await apiClient.patch(`/cupones/${id}/status`);
    return cuponSchema.parse(data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/cupones/${id}`);
  },
};