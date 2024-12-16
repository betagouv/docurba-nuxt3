export default defineEventHandler(async (event) => {
  const { old_record } = await readBody(event)

  // Ca sous entend que les procédures perim ne sont pas delete en cascade.
  // Est ce qu'on devrait les delete ici après avoir mis à jour le reste des status ?
  const { data: procedurePerim, error } = await supabase
    .from('procedures_perimetres')
    .select('*')
    .eq('procedure_id', old_record.id)
    .throwOnError()

  if (!procedurePerim.length) {
    console.log('no perim found')
    return
  }

  const communesCodes = procedurePerim.map(c => c.collectivite_code)
  const procedures = await fetchCommunesProcedures(communesCodes)
  const enrichedProcedures = await enrichProcedures(procedures)

  const communes = []
  for (const { collectivite_code, collectivite_type } of procedurePerim) {
    const commune = await findCommune({
      type: collectivite_type,
      code: collectivite_code,
    })
    if (commune) {
      communes.push(commune)
    }
  }

  await updatePerimetreStatus(communes, enrichedProcedures)

  console.log('finished update status', procedurePerim.length)

  return 'OK'
})