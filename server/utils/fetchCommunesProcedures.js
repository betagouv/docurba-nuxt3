import _ from 'lodash'
import dayjs from 'dayjs'

function sortEvents(events) {
  return events.sort((a, b) => {
    return a.timestamp - b.timestamp
  })
}

export default async function (inseeCodes) {
  const time = Date.now()

  const { data: proceduresRes } = await supabase.rpc('procedures_principales_by_collectivites', {
    codes: inseeCodes
  })

  const procedures = proceduresRes.filter(p => p.doc_type !== 'SD')

  const { data: events } = await supabase.rpc('events_by_procedures_ids', {
    procedures_ids: procedures.map(p => p.id)
  })

  const groupedEvents = _.groupBy(events, event => {
    event.timestamp = +dayjs(event.date_iso)
    return event.procedure_id
  })

  // console.log('Nb procedures with event', Object.keys(groupedEvents).length)

  procedures.forEach(p => {
    p.events = sortEvents(groupedEvents[p.id] || [])
  })

  console.log('fetched procedures in', (Date.now() - time) / 1000)

  return procedures
}
