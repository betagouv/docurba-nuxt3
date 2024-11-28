import _ from 'lodash'

let communesMap = null
let communes = null

export default defineCachedFunction(async (query) => {
  const queryKeys = Object.keys(query)

  try {
    if(queryKeys.length === 1 && queryKeys[0] === 'code') {
      if(!communesMap) {
        communesMap = await useStorage('assets:server').getItem(`/referentiels/communes_2024_map.json`)
      }

      return communesMap[query.code]
    } else {
      if(!communes) {
        communes = await useStorage('assets:server').getItem(`/referentiels/communes.json`)
      }

      return _.find(communes, query)
    }
  } catch (err) {
    console.log('err findCommune', err)
    return null
  }
}, {
  name: 'findCommune',
  maxAge: 60 * 60
})
