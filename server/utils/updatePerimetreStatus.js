export default async function (commune, procedures) {
  const communeProcedures = procedures.filter(p => {
    return !!p.procedures_perimetres.find(c => {
      return c.collectivite_code === commune.code && c.collectivite_type === commune.type
    })
  })

  const enrichedCommune = await getCommuneProcedures(commune, communeProcedures)

  const plan = enrichedCommune.planOpposable
  const scot = enrichedCommune.scotOpposable

  console.log('Updating perimetre for', commune.code, commune.type)

  await supabase.from('procedures_perimetres').update({
    opposable: false
  }).match({
    collectivite_code: commune.code,
    collectivite_type: commune.type
  })

  if(plan) {
    // console.log('plan opposable', plan.id)

    await supabase.from('procedures_perimetres').update({
      opposable: true
    }).match({
      collectivite_code: commune.code,
      collectivite_type: commune.type,
      procedure_id: plan.id
    })
  }

  if(scot) {
    // console.log('scot opposable', scot.id)

    await supabase.from('procedures_perimetres').update({
      opposable: true
    }).match({
      collectivite_code: commune.code,
      collectivite_type: commune.type,
      procedure_id: scot.id
    })
  }
}