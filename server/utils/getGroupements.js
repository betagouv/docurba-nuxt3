import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  const queryKeys = Object.keys(query)

  if(queryKeys.length === 1 && (queryKeys[0] === 'code' || queryKeys[0] === 'siren')) {
    return await findGroupement(query)
  } else {
    const groupements = await useStorage('assets:server').getItem(`/referentiels/groupements.json`)
    
    _.forEach(query, (val, key) => {
      if (val === 'true' || val === 'false') {
        query[key] = val === 'true';
      }
    })
    
    const filterredGroupements = _.filter(groupements, query)
    return filterredGroupements
  }
}, {
  name: 'getGroupements',
  maxAge: 60 * 60
})
