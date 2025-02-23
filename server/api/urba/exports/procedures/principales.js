import { AsyncParser } from '@json2csv/node';
import dayjs from 'dayjs'
import _ from 'lodash'

const csvParser = new AsyncParser();

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    let principales = await getProcedures(Object.assign({
      is_principale: true
    }, query))

    // Procedure principale with no prescription should not appear in exports
    principales = principales.filter(p => !!p.prescription)

    console.log('principales', principales.length)

    let secondaires = await getProcedures({
      principalesIds: principales.map(p => p.id)
    })

    console.log('secondaires', secondaires.length)

    const groupedSecondaries = _.groupBy(secondaires, s => s.secondary_procedure_of)

    principales.forEach(p => {
      if(p.doc_type === 'PLU') {
        p.docType = p.docType.replace('s', '')
      }
      
      if(groupedSecondaries[p.id]) {
        p.secondaires = groupedSecondaries[p.id].toSorted((a, b) => {
          return +dayjs(b.created_at) - +dayjs(a.created_at)
        })
      }
    })

    const exportMap = await useStorage('assets:server').getItem(`/exportMaps/dhupProceduresPrincipales.json`)
    const mapedData = mapExport(exportMap, principales)

    return csvParser.parse(mapedData)
  } catch (err) {
    console.log('Error in route', err)
    return err
  }
})
