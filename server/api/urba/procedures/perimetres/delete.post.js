export default defineEventHandler(async (event) => {
  const { old_record } = await readBody(event)
  const { collectivite_code, collectivite_type } = old_record

  const communesCodes = [old_record.collectivite_code]
  const procedures = await fetchCommunesProcedures(communesCodes)
  const enrichedProcedures = await enrichProcedures(procedures)

  const commune = await findCommune({
    type: collectivite_type,
    code: collectivite_code,
  })

  if(commune) {
    await updatePerimetreStatus([commune], enrichedProcedures)
  } else {
    console.log('Commune not found')
  }

  console.log('finished update status', commune.code)

  return 'OK'
})