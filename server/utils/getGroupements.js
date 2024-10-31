import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  const groupements = await useStorage('assets:server').getItem(`/referentiels/groupements.json`)
  
  _.forEach(query, (val, key) => {
    if (val === 'true' || val === 'false') {
      query[key] = val === 'true';
    }
  })
  
  const filterredGroupements = _.filter(groupements, query)
  console.log('filterredGroupements', filterredGroupements.length)
  return filterredGroupements
}, {
  name: 'getGroupements',
  maxAge: 60 * 60
})
