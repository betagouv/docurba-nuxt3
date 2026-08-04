import _ from 'lodash'
import dayjs from 'dayjs'

function sortEvents(events) {
  return events.sort((a, b) => {
    return b.timestamp - a.timestamp
  })
}

export default async function (inseeCodes) {
  const time = Date.now()

  const { data: procedures } = await supabase
    .from("procedures")
    .select("*, procedures_perimetres!inner ()")
    .eq('is_principale', true)
    .neq('doc_type', 'SD')
    .in('status', ['opposable', 'en cours'])
    .in('procedures_perimetres.collectivite_code', inseeCodes)
    .throwOnError()

  const procedures_ids = procedures.map(p => p.id)

  let { data: perimetres } = await supabase
    .from("procedures_perimetres")
    .select()
    .in('procedure_id', procedures_ids)
    .throwOnError()
  
  perimetres = _.groupBy(perimetres, perimetre => {
    return perimetre.procedure_id
  })

  let { data: events } = await supabase
    .from("doc_frise_events")
    .select()
    .in('procedure_id', procedures_ids)
    .throwOnError()

  events = _.groupBy(events, event => {
    event.timestamp = +dayjs(event.date_iso)
    return event.procedure_id
  })

  procedures.forEach(p => {
    p.events = sortEvents(events[p.id] || []) // left join doc_frise_events e on e.procedure_id = procedure.id
    p.procedures_perimetres = perimetres[p.id] || [] // left join procedures_perimetres pp on pp.procedure_id = procedure.id
  })

  console.log('fetched procedures in', (Date.now() - time) / 1000)

  return procedures
}
