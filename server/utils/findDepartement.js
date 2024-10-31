import _ from 'lodash'

export default defineCachedFunction(async (query) => {
  try {
    const departements = await useStorage('assets:server').getItem(`/INSEE/departements.json`)
    return _.find(departements, query)
  } catch (err){
    console.log('err findDepartement', err)
    return null
  } 
}, {
  name: 'findDepartement',
  maxAge: 60 * 60
})
