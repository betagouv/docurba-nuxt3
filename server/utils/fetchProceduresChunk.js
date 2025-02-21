import dayjs from 'dayjs'

function sortEvents(events) {
  return events.sort((a, b) => {
    return +dayjs(b.date_iso) - +dayjs(a.date_iso)
  })
}


function createQuery (query, filters = []) {
  const { year, ...queryWithoutYear } = query;

  const startOfYear = `${year}-01-01`
  const endOfYear = `${year}-12-31`

  const proceduresQuery = supabase.from('procedures')
    .select('id, type, created_at, from_sudocuh, collectivite_porteuse_id, is_principale, status, secondary_procedure_of, doc_type, is_scot, is_pluih, is_pdu, mandatory_pdu, moe, name')
    .match(queryWithoutYear)

  if(year) {
    proceduresQuery.gte('created_at', startOfYear).lte('created_at', endOfYear)
  }

  filters.forEach(filter => {
    const [operator, key, val] = filter
    proceduresQuery[operator](key, val)
  })

  proceduresQuery.order('created_at', { ascending: true })

  return proceduresQuery
}

export default defineCachedFunction(async (query, filters = [], start, end) => {
  let fetchedChunk = []

  if(query.principalesIds) {
    const { data, error } = await supabase.rpc('secondary_procedures_by_principale_ids', {
      procedures_ids: query.principalesIds
    })
    console.log('secondaries fetch', error)
    fetchedChunk = data.filter(p => p.type !== 'Mise à jour')
  } else if(query.proceduresIds) {
    const {data} = await supabase.rpc('procedures_by_ids', {procedures_ids: query.proceduresIds})
    fetchedChunk = data
  } else {
    const chunkQuery = createQuery(query, filters) 
    const {data, error} = await chunkQuery.range(start, end)

    if(error) {
      console.log('error fetching chunk', error)
    }

    fetchedChunk = data
  }

  const proceduresIds = fetchedChunk.map(p => p.id)

  const { data: perimetres } = await supabase
    .rpc('get_perimetres_by_procedures_ids', { procedure_ids: proceduresIds })

  fetchedChunk.forEach(p => {
    const perim = perimetres.find(perim => perim.procedure_id === p.id)
    p.procedures_perimetres = perim ? perim.perimetre_data : [] 
  })

  const { data: events, error: eventsError } = await supabase
    .rpc('events_by_procedures_ids', {
      procedures_ids: proceduresIds
    })

  if(eventsError) {
    console.log(eventsError)
  }

  fetchedChunk.forEach(p => {
    p.events = sortEvents(events.filter(e => e.procedure_id === p.id))
  })

  return fetchedChunk
}, {
  name: 'fetchProceduresChunk',
  maxAge: 60 * 60
})