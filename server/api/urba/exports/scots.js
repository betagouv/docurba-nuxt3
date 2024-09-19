import { AsyncParser } from '@json2csv/node';
import _ from 'lodash'
const csvParser = new AsyncParser();

export default defineEventHandler(async (event) => {
  try {
    const scots = await getProcedures({
      doc_type: 'SCOT',
      is_principale: true,
      archived: false,
      // id: '72420405-f1cc-4c8d-a526-1e73a9e74d81'
    })

    const groupedScots = _.groupBy(scots, 'collectivite_porteuse_id')

    const collectivites = _.map(groupedScots, (procedures) => {
      const proceduresByStatus = _.groupBy(procedures, 'status')

      procedures.forEach(procedure => {
        procedure.zonesBlanche = procedure.collectivite.membres.filter(c => {
          const perim = procedure.procedures_perimetres.find(p => {
            return p.type === c.type && p.collectivite_code === c.code
          })

          return c.type === 'COM' && !perim
        })
      }) 

      const opposables = sortProceduresByEvenCateg(proceduresByStatus['opposable'] || [])
      const currents = sortProceduresByEvenCateg((proceduresByStatus['en cours'] || []).filter((p) => {
        return p.from_sudocuh ? !!p.prescription : true
      }))

      return Object.assign({
        cog: '2024',
        opposables,
        currents,
        opposable: opposables[0],
        current: currents[0]
      }, procedures[0].collectivite)
    })

    const sudocuhScots = await useStorage('assets:server').getItem(`/exportMaps/sudocuhScots.json`)

    const mapedCollectivites = collectivites.map((c) => {
      let scot = _.mapValues(sudocuhScots, key => _.get(c, key, ''))

      return scot
    })

    return csvParser.parse(mapedCollectivites)
  } catch (err) {
    console.log('Error in route', err)
    return err
  }
})
