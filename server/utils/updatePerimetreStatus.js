import _ from "lodash"

export default async function (communes, procedures) {
  // Mark all procedures for communes as not opposable
  const communesByType = _.groupBy(communes, "type")
  for (const [collectivityType, communesOfType] of Object.entries(communesByType)) {
    await supabase
      .from("procedures_perimetres")
      .update({ opposable: false })
      .eq("opposable", true)
      .eq("collectivite_type", collectivityType)
      .in(
        "collectivite_code",
        communesOfType.map(c => c.code)
      )
      .throwOnError()
  }

  // Recompute opposability
  console.time("compute")
  const updatesToPerform = []
  for (const commune of communes) {
    const communeProcedures = procedures.filter(p => {
      return !!p.procedures_perimetres.find(c => {
        return (
          c.collectivite_code === commune.code && c.collectivite_type === commune.type
        )
      })
    })

    const enrichedCommune = await getCommuneProcedures(commune, communeProcedures)

    const plan = enrichedCommune.planOpposable
    const scot = enrichedCommune.scotOpposable

    console.log("Updating perimetre for", commune.code, commune.type)

    const proceduresOpposableForThisCommune = []
    if (plan) {
      proceduresOpposableForThisCommune.push(plan.id)
    }
    if (scot) {
      proceduresOpposableForThisCommune.push(scot.id)
    }

    if (proceduresOpposableForThisCommune.length) {
      updatesToPerform.push({
        collectivite_code: commune.code,
        collectivite_type: commune.type,
        procedure_ids: proceduresOpposableForThisCommune,
      })
    }
  }
  console.timeEnd("compute")

  // Update opposability, 30 at a time
  console.time("commit")
  for (const [index, chunkedUpdates] of _.chunk(updatesToPerform, 30).entries()) {
    const promisedUpdates = chunkedUpdates.map(
      ({ collectivite_code, collectivite_type, procedure_ids }) => {
        return supabase
          .from("procedures_perimetres")
          .update({ opposable: true })
          .match({ collectivite_code, collectivite_type })
          .in("procedure_id", procedure_ids)
          .throwOnError()
      }
    )
    await Promise.all(promisedUpdates)
    console.log(`Committed chunk ${index}`)
  }
  console.timeEnd("commit")
}
