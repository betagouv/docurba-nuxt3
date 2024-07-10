// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/eslint"],
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  routeRules: {
    "/api/urba/exports/**": {
      headers: {
        "Content-Type": "text/csv",
      },
    },
  },
});
