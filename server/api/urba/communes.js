export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const communes = await getCommunesProcedures(query)

  communes.forEach(c => {
    console.log(c.code, c.region.intitule)
  })

  return communes
})
