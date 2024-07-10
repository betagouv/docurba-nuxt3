import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  const regions = await useStorage('assets:server').getItem(`/INSEE/regions.json`)
  return _.find(regions, query)
}, {
  maxAge: 60 * 60
})
