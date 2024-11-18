async function updateStatus (communes) {
  const procedures = await fetchCommunesProcedures(communes.map(c => c.code))

  for (let index = 0; index < communes.length; index++) {
    const commune = communes[index]
    
    await updatePerimetreStatus(commune, procedures)
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const communes = await getCommunes(query)

  await updateStatus(communes)

  return 'OK'
})