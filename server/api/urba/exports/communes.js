import { AsyncParser } from '@json2csv/node';
import _ from 'lodash'
const csvParser = new AsyncParser();

export default defineEventHandler(async (event) => {
  const time = Date.now()

  try {
    const query = getQuery(event)

    const communes = await getCommunesProcedures(query)

    const sudocuhCommunes = await useStorage('assets:server').getItem(`/exportMaps/sudocuhCommunes.json`)

    const mapedCommunes = communes.map((c) => {
      return _.mapValues(sudocuhCommunes, key => _.get(c, key, ''))
    })

    console.log('Returned export in', (Date.now() - time) / 1000)

    return csvParser.parse(mapedCommunes)
  } catch (err) {
    console.log('Error in route', err)
    return err
  }
})
