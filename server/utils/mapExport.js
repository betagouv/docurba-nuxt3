import _ from 'lodash'

export default function mapExport (map, data) {
  return data.map(d => {
    return _.mapValues(map, key => _.get(d, key, ''))
  })
}