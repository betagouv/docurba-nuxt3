import _ from 'lodash'
import { AsyncParser } from '@json2csv/node';
const csvParser = new AsyncParser();

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const {doc_type, ...perimFilters} = query

  for(const key in perimFilters) {
    const val = perimFilters[key]

    if(val == 'true' || val == 'false') {
      perimFilters[key] = val == 'true'
    }
  }

  if(doc_type) {
    const {data: procedures} = await supabase.from('procedures').select('id')
      .eq('doc_type', doc_type)

    const { data: perimetresByProcedures } = await supabase.rpc('get_perimetres_by_procedures_ids', {
      procedure_ids: procedures.map(p => p.id)
    })
    
    const perimetres = []

    perimetresByProcedures.forEach((procedure) => {
      const {perimetre_data} = procedure

      if(perimetre_data && perimetre_data.length) {
        perimetres.push(...perimetre_data)
      }
    })

    const filteredPerims = _.filter(perimetres, perimFilters)

    return csvParser.parse(filteredPerims)
  } else {
    const perimQuery = supabase.from('procedures_perimetres').select('*')

    for(const key in perimFilters) {
      const val = query[key]
      const operator = Array.isArray(val) ? 'in' : 'eq'

      perimQuery[operator](key, val)
    }

    const {data: perimetres} = await perimQuery

    return csvParser.parse(perimetres)
  }
})
