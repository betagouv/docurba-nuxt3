import { AsyncParser } from '@json2csv/node'
import _ from 'lodash'
const csvParser = new AsyncParser()

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const status = []

  if (query.pa === 'true') status.push('opposable')
  if (query.pc === 'true') status.push('en cours')

  const defaultStatus = ['opposable', 'en cours']
  const queryStatus = status.length ? status : defaultStatus

  try {
    const scots = await getProcedures({
      doc_type: 'SCOT',
      is_principale: true,
      archived: false,
    }, [
      ['in', 'status', queryStatus]
    ])

    const groupedScots = _.groupBy(scots, 'collectivite_porteuse_id')

    const exportedScots = []

    _.forEach(groupedScots, (procedures) => {
      const proceduresByStatus = _.groupBy(procedures, 'status')

      procedures.forEach(procedure => {
        procedure.zonesBlanche = procedure.collectivite.membres.filter(c => {
          const perim = procedure.procedures_perimetres.find(p => {
            return p.type === c.type && p.collectivite_code === c.code
          })

          return c.type === 'COM' && !perim
        })
      }) 

      const opposables = sortProceduresByEvenCateg(proceduresByStatus['opposable'] || [], 'approbation').filter(p => {
        // Cela enlève les procédures précédentes.
        return !!p.procedures_perimetres.find(c => c.opposable)
      })

      const currents = sortProceduresByEvenCateg(proceduresByStatus['en cours'] || [], 'prescription').filter((p) => {
        return p.from_sudocuh ? !!p.prescription : true
      })

      // Cette situation ne doit pas exister
      if(currents.length > 1 && opposables > 1) {
        throw new Error('multiple current et opposables' + currents[0].collectivite.code)
      }

      // We want to avoid duplicated lines. So we only do multiple lines for either opposable or currents.
      // if you could have both multiple opposable and currents, it seems impossible to determine the correct combinaison.
      if(opposables.length >= 1) {
        opposables.forEach(p => {
          exportedScots.push(Object.assign({
            cog: '2024',
            opposables,
            currents,
            opposable: p,
            current: currents[0]
          }, p.collectivite))
        })
      } else {
        currents.forEach(p => {
          exportedScots.push(Object.assign({
            cog: '2024',
            opposables,
            currents,
            opposable: opposables[0],
            current: p
          }, p.collectivite))
        })
      }
    })

    const sudocuhScots = await useStorage('assets:server').getItem(`/exportMaps/sudocuhScots.json`)

    const mapedCollectivites = exportedScots.map((c) => {
      let scot = _.mapValues(sudocuhScots, key => _.get(c, key, ''))

      return scot
    })

    return csvParser.parse(mapedCollectivites)
  } catch (err) {
    console.log('Error in route', err)
    return err
  }
})
