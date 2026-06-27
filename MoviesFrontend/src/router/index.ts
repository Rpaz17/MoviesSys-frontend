import { createRouter, createWebHistory } from "vue-router";
import { useSessionStore } from "../stores/session";

import LoginView from "../views/auth/LoginView.vue";
import RegisterView from "../views/auth/RegisterView.vue";
import ForgotPasswordView from "../views/auth/ForgotPasswordView.vue";
import ResetPasswordView from "../views/auth/ResetPasswordView.vue";

import HomeRouterView from "../views/home/HomeRouterView.vue";

import ProfileView from "../views/profile/ProfileView.vue";
import PaymentMethodsView from "../views/profile/PaymentMethodsView.vue";
import ChangePasswordView from "../views/profile/ChangePasswordView.vue";

import FunctionsBrowseView from "../views/reservations/FunctionsBrowseView.vue";
import SeatSelectionView from "../views/reservations/SeatSelectionView.vue";
import MoviesBrowseView from "../views/reservations/MoviesBrowseView.vue";
import MovieDetailView from "../views/reservations/MovieDetailView.vue";
import PaymentResultView from "../views/reservations/PaymentResultView.vue";
import MyReservationsView from "../views/reservations/MyReservationsView.vue";

import ReceptionReservationsView from "../views/reception/ReceptionReservationsView.vue";
import SellFunctionsView from "../views/reception/SellFunctionsView.vue";
import SellSeatSelectionView from "../views/reception/SellSeatSelectionView.vue";

import AdminDashboardView from "../views/admin/AdminDashboardView.vue";
import AdminCustomersView from "../views/admin/AdminCustomersView.vue";
import AdminMoviesView from "../views/admin/AdminMoviesView.vue";
import AdminMovieFormView from "../views/admin/AdminMovieFormView.vue";
import AdminCinemasView from "../views/admin/AdminCinemasView.vue";
import AdminCinemaFormView from "../views/admin/AdminCinemaFormView.vue";
import AdminRoomsView from "../views/admin/AdminRoomsView.vue";
import AdminRoomFormView from "../views/admin/AdminRoomFormView.vue";
import AdminCitiesView from "../views/admin/AdminCitiesView.vue";
import AdminShowtimesView from "../views/admin/AdminShowtimesView.vue";
import AdminEditShowtimeView from "../views/admin/AdminEditShowtimeView.vue";
import AdminReportsView from "../views/admin/AdminReportsView.vue";
import AdminCouponsView from "../views/admin/AdminCouponsView.vue";
import AdminCancellationPolicyView from "../views/admin/AdminCancellationPolicyView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/reservas/funciones" },

    // Auth
    { path: "/login", name: "login", component: LoginView, meta: { guest: true } },
    { path: "/register", name: "register", component: RegisterView, meta: { guest: true } },
    { path: "/forgot", name: "forgot", component: ForgotPasswordView, meta: { guest: true } },
    { path: "/reset", name: "reset", component: ResetPasswordView, meta: { guest: true } },

    // Home
    { path: "/home", name: "home", component: HomeRouterView, meta: { auth: true } },

    // Profile
    { path: "/profile", name: "profile", component: ProfileView, meta: { auth: true } },
    { path: "/profile/payments", name: "payment-methods", component: PaymentMethodsView, meta: { auth: true, role: "cliente" } },
    { path: "/change-password", name: "change-password", component: ChangePasswordView, meta: { auth: true } },

    // Reservations
    { path: "/reservas/funciones", name: "available-functions", component: FunctionsBrowseView },
    { path: "/reservas/funciones/:showtimeId/asientos", name: "seat-selection", component: SeatSelectionView, meta: { auth: true } },
    { path: "/reservas/peliculas", name: "available-movies", component: MoviesBrowseView },
    { path: "/reservas/peliculas/:movieId", name: "movie-detail", component: MovieDetailView },
    { path: "/reservas/resultado/:reservationId", name: "payment-result", component: PaymentResultView, meta: { auth: true, role: "cliente" } },
    { path: "/reservas/mis-reservas", name: "my-reservations", component: MyReservationsView, meta: { auth: true, role: "cliente" } },

    // Reception
    { path: "/recepcion/reservas", name: "reception-reservations", component: ReceptionReservationsView, meta: { auth: true, roles: ["recepcionista", "administrador"] } },
    { path: "/recepcion/vender", name: "reception-sell", component: SellFunctionsView, meta: { auth: true } },
    { path: "/recepcion/vender/:showtimeId", name: "reception-sell-seats", component: SellSeatSelectionView, meta: { auth: true } },

    // Admin
    { path: "/admin", name: "admin-dashboard", component: AdminDashboardView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/clientes", name: "admin-customers", component: AdminCustomersView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/peliculas", name: "admin-movies", component: AdminMoviesView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/peliculas/crear", name: "admin-create-movie", component: AdminMovieFormView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/peliculas/:id/editar", name: "admin-edit-movie", component: AdminMovieFormView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/cines", name: "admin-cinemas", component: AdminCinemasView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/cines/crear", name: "admin-create-cinema", component: AdminCinemaFormView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/cines/:id/editar", name: "admin-edit-cinema", component: AdminCinemaFormView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/salas", name: "admin-rooms", component: AdminRoomsView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/salas/crear", name: "admin-create-room", component: AdminRoomFormView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/salas/:id/editar", name: "admin-edit-room", component: AdminRoomFormView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/ciudades", name: "admin-cities", component: AdminCitiesView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/funciones", name: "admin-showtimes", component: AdminShowtimesView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/funciones/:id/editar", name: "admin-edit-showtime", component: AdminEditShowtimeView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/reportes", name: "admin-reports", component: AdminReportsView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/cupones", name: "admin-coupons", component: AdminCouponsView, meta: { auth: true, role: "administrador" } },
    { path: "/admin/cancelaciones", name: "admin-cancellations", component: AdminCancellationPolicyView, meta: { auth: true, role: "administrador" } },
  ],
});

router.beforeEach((to) => {
  const session = useSessionStore();
  if (to.meta.auth && !session.user) return "/login";
  if (to.meta.guest && session.user) {
    if (session.isAdmin) return "/admin";
    return "/home";
  }
  if (to.meta.role && session.user?.role !== to.meta.role) return "/home";
  if (to.meta.roles && !(to.meta.roles as string[]).includes(session.user?.role ?? "")) return "/home";
  if (to.path === "/home" && session.isAdmin) return "/admin";
  return true;
});
