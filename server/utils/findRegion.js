import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  try {
    const regions = await useStorage('assets:server').getItem(`/INSEE/regions.json`)
    return _.find(regions, query)
  } catch (err) {
    console.log('err findRegion', err)
    return null
  }
}, {
  name: 'findRegion',
  maxAge: 60 * 60
})
