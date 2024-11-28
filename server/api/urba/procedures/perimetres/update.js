async function updateStatus (communes) {
  const procedures = await fetchCommunesProcedures(communes.map(c => c.code))
  const enrichedProcedures = await enrichProcedures(procedures)

  for (let index = 0; index < communes.length; index++) {
    const commune = communes[index]
    
    await updatePerimetreStatus(commune, enrichedProcedures)
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const communes = await getCommunes(query)

  await updateStatus(communes)

  return 'OK'
})