export default defineCachedFunction(async (code) => {
  const BCSI = await useStorage('assets:server').getItem(`/sudocuh/BCSI.json`)
  return BCSI.du_codeEtat[code]
}, {
  maxAge: 60 * 60
})
