export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const communes = await getCommunesProcedures(query)

  // console.log(communes[0])

  return communes
})
