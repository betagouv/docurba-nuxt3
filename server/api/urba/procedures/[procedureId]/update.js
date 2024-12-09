async function updateStatus(procedureId) {
  const { data: procedurePerim, error } = await supabase
    .from("procedures_perimetres")
    .select("*")
    .eq("procedure_id", procedureId)
    .throwOnError()

  if (!procedurePerim.length) {
    console.log("no perim found")
    return
  }

  const procedures = await fetchCommunesProcedures(
    procedurePerim.map(c => c.collectivite_code)
  )
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

  console.log("finished update status", procedurePerim.length)
}

export default defineEventHandler(async event => {
  const procedureId = getRouterParam(event, "procedureId")
  await updateStatus(procedureId)

  return "OK"
})
