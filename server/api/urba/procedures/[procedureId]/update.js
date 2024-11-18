async function updateStatus (procedureId) {
  const {data: procedurePerim, error} = await supabase.from('procedures_perimetres')
      .select('*').eq('procedure_id', procedureId)

    if(error) {
      console.log('error in updateStatus', error, procedureId)
    }

    if(procedurePerim && procedurePerim.length) {

    const procedures = await fetchCommunesProcedures(procedurePerim.map(c => c.collectivite_code))

    for (let i = 0; i < procedurePerim.length; i++) {
      const {collectivite_code, collectivite_type} = procedurePerim[i]
      const commune = await findCommune({type: collectivite_type, code: collectivite_code})

      await updatePerimetreStatus(commune, procedures)
    }

    console.log('finished update status', procedurePerim.length)
  } else {
    console.log('no perim found')
  }
}

export default defineEventHandler(async (event) => {
    const procedureId = getRouterParam(event, 'procedureId')
    await updateStatus(procedureId)

    return 'OK'
  })
  