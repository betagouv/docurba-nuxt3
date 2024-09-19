import dayjs from 'dayjs'

function sortEvents(events) {
  return events.sort((a, b) => {
    return +dayjs(a.date_iso) - +dayjs(b.date_iso)
  })
}

export default async function (inseeCodes) {
  const time = Date.now()

  const { data: procedures } = await supabase.rpc('procedures_principales_by_collectivites', {
    codes: inseeCodes
  })

  const { data: events, error } = await supabase.rpc('events_by_procedures_ids', {
    procedures_ids: procedures.map(p => p.id)
  })

  procedures.forEach(p => {
    p.events = sortEvents(events.filter(e => e.procedure_id === p.id))
  })

  console.log('fetched procedures in', (Date.now() - time) / 1000)

  return procedures.filter(p => p.doc_type !== 'SD')
}
