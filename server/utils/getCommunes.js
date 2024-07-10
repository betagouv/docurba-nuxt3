import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  const communes = await useStorage('assets:server').getItem(`/referentiels/communes.json`)
  return _.filter(communes, query)
}, {
  maxAge: 60 * 60
})
