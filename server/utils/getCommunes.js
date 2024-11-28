import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  const queryKeys = Object.keys(query)

  if(queryKeys.length === 1 && queryKeys[0] === 'code') {
    return await findCommune(query)
  } else {
    const communes = await useStorage('assets:server').getItem(`/referentiels/communes.json`)
    return _.filter(communes, query)
  }
}, {
  name: 'getCommunes',
  maxAge: 60 * 60
})
