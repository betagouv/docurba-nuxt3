export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const [communes, groupements] = await Promise.all([
    getCommunes(query),
    searchGroupements(query)
  ])

  return [
    ...communes,
    ...groupements
  ]
})
