export default defineCachedFunction(async (communeCode) => {
  const nouvelles = await useStorage('assets:server').getItem(`/INSEE/communesNouvelles.json`)
  return nouvelles.includes(communeCode)
}, {
  maxAge: 60 * 60
})
