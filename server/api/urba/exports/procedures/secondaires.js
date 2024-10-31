import { AsyncParser } from '@json2csv/node';
import dayjs from 'dayjs'
import _ from 'lodash'

const csvParser = new AsyncParser();

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const secondaires = await getProcedures(Object.assign({
      is_principale: false
    }, query), [
      ['neq', 'type', 'Mise à jour']
    ])

    console.log('secondaires', secondaires.length)

    if(!secondaires.length) return 'No Data'

    const principales = await getProcedures({
      proceduresIds: secondaires.map(s => s.secondary_procedure_of)
    })

    console.log('principales', principales.length)

    const groupedSecondaries = _.groupBy(secondaires, s => s.secondary_procedure_of)

    const principalesMap = {}

    principales.forEach(p => {
      if(p.doc_type === 'PLU') {
        p.docType = p.docType.replace('s', '')
      }
      
      if(groupedSecondaries[p.id]) {
        p.secondaires = groupedSecondaries[p.id].toSorted((a, b) => {
          return +dayjs(b.created_at) - +dayjs(a.created_at)
        })
      }

      principalesMap[p.id] = p
    })

    secondaires.forEach(s => {
      if(principalesMap[s.secondary_procedure_of]) {
        s.principale = principalesMap[s.secondary_procedure_of]
        s.isLastScondary = s.id === s.principale.secondaires[0].id
      }

      if(s.created_at) {
        s.year = dayjs(s.created_at.substring(0, 10)).format('YYYY')
      }
    })

    const exportMap = await useStorage('assets:server').getItem(`/exportMaps/dhupProceduresSecondaires.json`)
    const mapedData = mapExport(exportMap, secondaires.filter(s => {
      return !!s.principale
    }))

    console.log('SEND CSV')

    return csvParser.parse(mapedData)
  } catch (err) {
    console.log('Error in route', err)
    return err
  }
})
