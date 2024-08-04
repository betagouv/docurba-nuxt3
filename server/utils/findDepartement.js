import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  const departements = await useStorage('assets:server').getItem(`/INSEE/departements.json`)
  return _.find(departements, query)
}, {
  name: 'findDepartement',
  maxAge: 60 * 60
})
