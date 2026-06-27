// ─── App routing types ────────────────────────────────────────────────────────
export type AppView  = "login" | "register" | "forgot" | "reset";
export type AuthView = "home" | "profile" | "changepass" | "customers" |
  "createMovie" | "editMovie" | "movieList" | "cinemaList" | "roomList" | "createCinema" | "createRoom" |
  "availableMovies" | "myReservations" | "reservationReports" | "coupons" | "cityList" | "showtimeList" | "cancellationSettings";

// ─── Session ──────────────────────────────────────────────────────────────────
export interface SessionUser {
  name:   string;
  avatar: string;
  email:  string;
  role:   "cliente" | "administrador" | "recepcionista";
}

// ─── Customers ────────────────────────────────────────────────────────────────
export interface Customer {
  id:            string;
  name:          string;
  email:         string;
  phone:         string;
  status:        "activo" | "inactivo" | "suspendido";
  registeredAt:  string;
  reservations:  number;
  spent:         string;
  avatar:        string;
}
export type SortKey = "name" | "registeredAt" | "reservations" | "spent";
export type SortDir = "asc" | "desc";

// ─── Movies ───────────────────────────────────────────────────────────────────
export interface CatalogMovie {
  id:           string;
  title:        string;
  genre:        string;
  language:     string;
  rating:       string;
  duration:     string;
  releaseDate:  string;
  director:     string;
  activo:       boolean;
  reservations: number;
  revenue:      string;
  img:          string;
}

export interface MovieForm {
  title:         string;
  originalTitle: string;
  synopsis:      string;
  genres:        string[];
  language:      string;
  subtitles:     string;
  rating:        string;
  duration:      string;
  releaseDate:   string;
  director:      string;
  cast:          string;
  trailer:       string;
  status:        "proximamente" | "en-cartelera" | "sin-publicar";
  imageUrl:      string;
  roomIds:       string[];
}

// ─── Cinema ───────────────────────────────────────────────────────────────────
export interface CinemaForm {
  name:    string;
  address: string;
  city:    string;
}

export type AdminStatus = "activo" | "mantenimiento" | "inactivo";

export interface Cinema {
  id:        string;
  name:      string;
  address:   string;
  city:      string;
  status:    AdminStatus;
  rooms:     number;
  functions: number;
  revenue:   string;
  img:       string;
}

export interface Room {
  id:        string;
  name:      string;
  cinemaId:  string;
  cinema:    string;
  type:      "2D" | "3D" | "IMAX" | "VIP";
  rows:      number;
  cols:      number;
  status:    AdminStatus;
  functions: number;
  occupancy: number;
}

export interface Showtime {
  id:           string;
  movieId:      string;
  cinemaId:     string;
  roomId:       string;
  date:         string;
  time:         string;
  format:       "2D" | "3D" | "IMAX" | "VIP";
  status:       AdminStatus;
  reservations: number;
  revenue:      string;
}

export type ReservationStatus = "pendiente" | "confirmada" | "cancelada";
export type PaymentStatus = "pendiente" | "pagado" | "reembolsado";
export type PaymentMethod = "tarjeta" | "efectivo";
export type RefundStatus = "no-aplica" | "pendiente" | "procesando" | "completado";
export type CouponType = "porcentaje" | "monto";

export interface Coupon {
  id:        string;
  code:      string;
  type:      CouponType;
  value:     number;
  expiresAt: string;
  active:    boolean;
  uses:      number;
}

export interface Reservation {
  id:            string;
  customerName:  string;
  customerEmail: string;
  movieId:       string;
  showtimeId:    string;
  cinemaId:      string;
  roomId:        string;
  date:          string;
  time:          string;
  seats:         string[];
  status:        ReservationStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  couponCode?:    string;
  discount?:      number;
  cancelledAt?:   string;
  refundStatus?:  RefundStatus;
  refundAmount?:  number;
  cancellationPolicy?: string;
  total:         number;
  createdAt:     string;
}

// ─── Poster uploader ──────────────────────────────────────────────────────────
export type PosterSource = "upload" | "url" | "sample";
