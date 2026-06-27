<script setup lang="ts">
import { useSessionStore } from "../../stores/session";
import { useRouter } from "vue-router";
import HomeClienteView from "./HomeClienteView.vue";
import HomeRecepcionistaView from "./HomeRecepcionistaView.vue";

const session = useSessionStore();
const router = useRouter();

if (session.isAdmin) router.replace("/admin");
</script>

<template>
  <HomeRecepcionistaView v-if="session.isReceptionist" />
  <HomeClienteView v-else />
</template>
