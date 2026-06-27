import { z } from "zod";
import { apiClient } from "../lib/api-client";

// ── Zod schemas ────────────────────────────────────────────────────────────────

export const createReservaInputSchema = z.object({
  id_usuario: z.number(),
  id_funcion: z.number(),
  asientosIds: z.array(z.number()),
});
export type CreateReservaInput = z.infer<typeof createReservaInputSchema>;

export const reservaSchema = z.object({
  id: z.union([z.string(), z.number()]),
  numero_reserva: z.string().optional(),
  id_usuario: z.union([z.string(), z.number()]).optional(),
  id_funcion: z.union([z.string(), z.number()]).optional(),
  estado: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  total_asientos: z.number().optional(),
  usuario: z.object({
    id: z.union([z.string(), z.number()]),
    nombre: z.string(),
    email: z.string(),
  }).optional(),
  funcion: z.object({
    id: z.union([z.string(), z.number()]),
    fecha_hora: z.string(),
    estado: z.string(),
    pelicula: z.object({
      id: z.union([z.string(), z.number()]),
      titulo: z.string(),
    }).optional(),
    sala: z.object({
      id: z.union([z.string(), z.number()]),
      nombre: z.string(),
      cine: z.object({
        id: z.union([z.string(), z.number()]),
        nombre: z.string(),
      }).optional(),
    }).optional(),
  }).optional(),
});
export type ReservaAPI = z.infer<typeof reservaSchema>;

export const pagoInputSchema = z.object({
  id_reserva: z.number(),
  metodo: z.string(),
  precio_por_asiento: z.number().min(1),
  codigo_cupon: z.string().optional(),
  referencia_externa: z.string().optional(),
});
export type PagoInput = z.infer<typeof pagoInputSchema>;

export const pagoEfectivoInputSchema = z.object({
  id_reserva: z.number(),
  precio_por_asiento: z.number().min(1),
  referencia_externa: z.string().optional(),
});
export type PagoEfectivoInput = z.infer<typeof pagoEfectivoInputSchema>;

export const pagoResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  monto_original: z.string().optional(),
  monto_descuento: z.string().optional(),
  monto_final: z.string().optional(),
  metodo: z.string().optional(),
  estado: z.string().optional(),
  created_at: z.string().optional(),
});
export type PagoResponse = z.infer<typeof pagoResponseSchema>;

export const cuponSchema = z.object({
  id: z.union([z.string(), z.number()]),
  codigo: z.string(),
  tipo: z.string(),
  valor: z.union([z.string(), z.number()]),
  fecha_expiracion: z.string(),
  usos_maximos: z.number().optional(),
  usos_actuales: z.number().optional(),
  activo: z.boolean().optional(),
  created_at: z.string().optional(),
});
export type CuponAPI = z.infer<typeof cuponSchema>;

export const validateCuponInputSchema = z.object({
  codigo: z.string(),
});
export type ValidateCuponInput = z.infer<typeof validateCuponInputSchema>;

export const validateCuponResponseSchema = z.object({
  tipo: z.string(),
  valor: z.union([z.string(), z.number()]),
});

export const reembolsoInputSchema = z.object({
  id_pago: z.number(),
});

export const reembolsoResponseSchema = z.object({
  id: z.number(),
  monto: z.number(),
  estado: z.string(),
  fecha_procesado: z.string().optional(),
  createdAt: z.string().optional(),
  horas_anticipacion: z.number().optional(),
  porcentaje_aplicado: z.number().optional(),
  monto_original: z.number().optional(),
});

// ── Service ────────────────────────────────────────────────────────────────────

export const reservasService = {
  async create(payload: CreateReservaInput): Promise<ReservaAPI> {
    const { data } = await apiClient.post("/reservas", payload);
    return reservaSchema.parse(data);
  },

  async findAll(): Promise<ReservaAPI[]> {
    const { data } = await apiClient.get("/reservas");
    return z.array(reservaSchema).parse(data);
  },

  async findOne(id: number | string): Promise<ReservaAPI> {
    const { data } = await apiClient.get(`/reservas/${id}`);
    return reservaSchema.parse(data);
  },

  async update(id: number | string, payload: { estado: string }): Promise<void> {
    await apiClient.patch(`/reservas/${id}`, payload);
  },

  async cancel(id: number | string): Promise<void> {
    await apiClient.post(`/reservas/${id}/cancelar`);
  },

  async remove(id: number | string): Promise<void> {
    await apiClient.delete(`/reservas/${id}`);
  },

  async processPayment(payload: PagoInput): Promise<PagoResponse> {
    const { data } = await apiClient.post("/pagos", payload);
    return pagoResponseSchema.parse(data);
  },

  async processCashPayment(payload: PagoEfectivoInput): Promise<PagoResponse> {
    const { data } = await apiClient.post("/pagos/efectivo", payload);
    return pagoResponseSchema.parse(data);
  },

  async validateCoupon(payload: ValidateCuponInput): Promise<z.infer<typeof validateCuponResponseSchema> | null> {
    try {
      const { data } = await apiClient.post("/cupones/validar", payload);
      return validateCuponResponseSchema.parse(data);
    } catch {
      return null;
    }
  },

  async findAllCoupons(): Promise<CuponAPI[]> {
    const { data } = await apiClient.get("/cupones");
    return z.array(cuponSchema).parse(data);
  },

  async calculateRefund(payload: { id_pago: number }): Promise<z.infer<typeof reembolsoResponseSchema> | null> {
    try {
      const { data } = await apiClient.post("/reembolsos", payload);
      return reembolsoResponseSchema.parse(data);
    } catch {
      return null;
    }
  },
};
