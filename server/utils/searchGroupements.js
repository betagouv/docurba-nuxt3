import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  const groupements = await useStorage('assets:server').getItem(`/referentiels/groupements_2024.json`)
  return _.filter(groupements, query)
}, {
  name: 'getGroupements',
  maxAge: 60 * 60
})
