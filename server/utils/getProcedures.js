export default defineCachedFunction(async (query) => {
  const time = Date.now()
  const {data: procedures} = await supabase.from('procedures')
    .select('*, procedures_perimetres(*), doc_frise_events(*)').match(query)

  console.log(`Fetched procedures in ${Date.now() - time}ms`)

  // console.log('procedures', procedures.length)

  let enrichedProcedures = await Promise.all(procedures.map(async procedure => {
    // console.log('procedure', procedure.id)
    const collectiviteId = procedure.collectivite_porteuse_id
    const collectiviteQuery = {code: collectiviteId}

    const collectivite = collectiviteId.length > 5 ? await findGroupement(collectiviteQuery) : await findCommune(collectiviteQuery)
    
    if(collectivite) {
      procedure.collectivite = collectivite
      procedure.collectivite.region = await findRegion({code: collectivite.regionCode})
      procedure.collectivite.departement = await findDepartement({code: collectivite.departementCode})
    } else {
      console.log('Missing Collectivite')
    }

    return procedure
  }))

  enrichedProcedures = enrichProcedures(enrichedProcedures.filter(p => !!p.collectivite))

  return enrichedProcedures
}, {
  name: 'getProcedures',
  maxAge: 60 * 60
})
