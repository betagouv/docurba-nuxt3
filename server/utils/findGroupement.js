import _ from 'lodash'

let groupementMap = null
let groupements = null

export default defineCachedFunction(async (query) => {
  const queryKeys = Object.keys(query)

  try {
    if(queryKeys.length === 1 && (queryKeys[0] === 'code' || queryKeys[0] === 'siren')) {
      if(!groupementMap) {
        groupementMap = await useStorage('assets:server').getItem(`/referentiels/groupements_2024_map.json`)
      }

      return groupementMap[query.code || query.siren]
    } else {
      if(!groupements) {
        groupements = await useStorage('assets:server').getItem(`/referentiels/groupements.json`)
      }

      return _.find(groupements, query)
    }
  } catch (err) {
    console.log('err findGroupement', err)
    return null
  }
}, {
  name: 'findGroupement',
  maxAge: 60 * 60
})
