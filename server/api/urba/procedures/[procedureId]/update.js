async function updateStatus (procedureId) {
  const {data: procedurePerim, error} = await supabase.from('procedures_perimetres')
      .select('*').eq('procedure_id', procedureId)

    if(error) {
      console.log('error in updateStatus', error, procedureId)
    }

    if(procedurePerim && procedurePerim.length) {

    const procedures = await fetchProcedures(procedurePerim.map(c => c.collectivite_code))

    for (let i = 0; i < procedurePerim.length; i++) {
      const {collectivite_code, collectivite_type} = procedurePerim[i]
      const commune = await findCommune({type: collectivite_type, code: collectivite_code})

      const communeProcedures = procedures.filter(p => {
        return !!p.procedures_perimetres.find(c => {
          return c.collectivite_code === commune.code && c.collectivite_type === commune.type
        })
      })

      const enrichedCommune = await getCommuneProcedures(commune, communeProcedures)

      const plan = enrichedCommune.planOpposable
      const scot = enrichedCommune.scotOpposable

      console.log(collectivite_code, collectivite_type)

      await supabase.from('procedures_perimetres').update({
        opposable: false
      }).match({
        collectivite_code,
        collectivite_type
      })

      if(plan) {
        console.log('plan opposable', plan.id)

        await supabase.from('procedures_perimetres').update({
          opposable: true
        }).match({
          collectivite_code,
          collectivite_type,
          procedure_id: plan.id
        })
      }

      if(scot) {
        console.log('scot opposable', scot.id)

        await supabase.from('procedures_perimetres').update({
          opposable: true
        }).match({
          collectivite_code,
          collectivite_type,
          procedure_id: scot.id
        })
      }
    }

    console.log('finished update status', procedurePerim.length)
  } else {
    console.log('no perim found')
  }
}

export default defineEventHandler(async (event) => {
    const procedureId = getRouterParam(event, 'procedureId')
    updateStatus(procedureId)

    return 'OK'
  })
  