import { AsyncParser } from '@json2csv/node';
import _ from 'lodash'
const csvParser = new AsyncParser();

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const communes = await getCommunesProcedures(query)

  const sudocuhCommunes = await useStorage('assets:server').getItem(`/exportMaps/sudocuhCommunes.json`)

  const mapedCommunes = communes.map((c) => {
    return _.mapValues(sudocuhCommunes, key => _.get(c, key, ''))
  })

  return csvParser.parse(mapedCommunes)
})
