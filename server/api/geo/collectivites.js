export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const [communes, groupements] = await Promise.all([
    getCommunes(query),
    getGroupements(query)
  ])

  return [
    ...communes,
    ...groupements
  ]
})
