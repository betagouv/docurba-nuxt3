import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  try {
    const groupements = await useStorage('assets:server').getItem(`/referentiels/groupements.json`)
    return _.find(groupements, query)
  } catch (err) {
    console.log('err findGroupement', err)
    return null
  }
}, {
  name: 'findGroupement',
  maxAge: 60 * 60
})
