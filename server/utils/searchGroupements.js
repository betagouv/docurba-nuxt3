import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  let populate = false

  if(query.populate === 'true') {
    populate = true
    delete query.populate
  }

  const groupements = await useStorage('assets:server').getItem(`/referentiels/groupements_2024.json`)

  const filteredGroupements = _.filter(groupements, query)

  if(populate) {
    for (let index = 0; index < filteredGroupements.length; index++) {
      const groupement = filteredGroupements[index]
      const membres = await populateMembres(groupement.membres)
      groupement.membres.push(...membres)
    }
  }

  return filteredGroupements
}, {
  name: 'searchGroupements',
  maxAge: 60 * 60
})
