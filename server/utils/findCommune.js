import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  try {
    const communes = await useStorage('assets:server').getItem(`/referentiels/communes.json`)
    return _.find(communes, query)
  } catch (err) {
    console.log('err findCommune', err)
    return null
  }
}, {
  name: 'findCommune',
  maxAge: 60 * 60
})
