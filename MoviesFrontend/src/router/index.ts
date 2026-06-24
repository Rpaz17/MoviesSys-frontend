import { createRouter, createWebHistory } from "vue-router";
import { useSessionStore } from "../stores/session";
import AuthView from "../views/AuthView.vue";
import HomeView from "../views/HomeView.vue";
import ProfileView from "../views/ProfileView.vue";
import AdminCatalogView from "../views/AdminCatalogView.vue";
import ReservationsView from "../views/ReservationsView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/reservas/funciones" },
    { path: "/login", name: "login", component: AuthView, meta: { guest: true, mode: "login" } },
    { path: "/register", name: "register", component: AuthView, meta: { guest: true, mode: "register" } },
    { path: "/forgot", name: "forgot", component: AuthView, meta: { guest: true, mode: "forgot" } },
    { path: "/reset", name: "reset", component: AuthView, meta: { guest: true, mode: "reset" } },
    { path: "/home", name: "home", component: HomeView, meta: { auth: true } },
    { path: "/profile", name: "profile", component: ProfileView, meta: { auth: true, mode: "profile" } },
    { path: "/profile/payments", name: "payment-methods", component: ProfileView, meta: { auth: true, role: "cliente", mode: "payments" } },
    { path: "/change-password", name: "change-password", component: ProfileView, meta: { auth: true, mode: "password" } },
    { path: "/reservas/funciones", name: "available-functions", component: ReservationsView, meta: { mode: "functions" } },
    { path: "/reservas/peliculas", name: "available-movies", component: ReservationsView, meta: { mode: "movies" } },
    { path: "/reservas/resultado", name: "payment-result", component: ReservationsView, meta: { auth: true, role: "cliente", mode: "result" } },
    { path: "/reservas/mis-reservas", name: "my-reservations", component: ReservationsView, meta: { auth: true, role: "cliente", mode: "mine" } },
    { path: "/recepcion/reservas", name: "reception-reservations", component: ReservationsView, meta: { auth: true, role: "recepcionista", mode: "reception" } },
    { path: "/recepcion/vender", name: "reception-sell", component: ReservationsView, meta: { auth: true, mode: "sell" } },
    { path: "/admin", name: "admin-dashboard", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "dashboard" } },
    { path: "/admin/clientes", name: "admin-customers", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "customers" } },
    { path: "/admin/peliculas", name: "admin-movies", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "movies" } },
    { path: "/admin/peliculas/crear", name: "admin-create-movie", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "createMovie" } },
    { path: "/admin/peliculas/editar", name: "admin-edit-movie", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "editMovie" } },
    { path: "/admin/cines", name: "admin-cinemas", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "cinemas" } },
    { path: "/admin/cines/crear", name: "admin-create-cinema", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "createCinema" } },
    { path: "/admin/cines/editar", name: "admin-edit-cinema", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "editCinema" } },
    { path: "/admin/salas", name: "admin-rooms", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "rooms" } },
    { path: "/admin/salas/crear", name: "admin-create-room", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "createRoom" } },
    { path: "/admin/salas/editar", name: "admin-edit-room", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "editRoom" } },
    { path: "/admin/ciudades", name: "admin-cities", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "cities" } },
    { path: "/admin/funciones", name: "admin-showtimes", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "showtimes" } },
    { path: "/admin/funciones/editar", name: "admin-edit-showtime", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "editShowtime" } },
    { path: "/admin/reportes", name: "admin-reports", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "reports" } },
    { path: "/admin/cupones", name: "admin-coupons", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "coupons" } },
    { path: "/admin/cancelaciones", name: "admin-cancellations", component: AdminCatalogView, meta: { auth: true, role: "administrador", mode: "cancellations" } },
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
  if (to.path === "/home" && session.isAdmin) return "/admin";
  return true;
});
