async function fetchChunks (query, filters = []) {
  if(query.proceduresIds || query.principalesIds) {
    return await fetchProceduresChunk(query)
  } else {
    let procedures = []
    const chunkSize = 1000
    let currentOffset = 0
    let hasMore = true

    while(hasMore) {
      const time = Date.now()
      
      const fetchedChunk = await fetchProceduresChunk(query, filters, currentOffset, currentOffset + chunkSize - 1)

      if(fetchedChunk.length < chunkSize) {
        hasMore = false
      }

      procedures = procedures.concat(fetchedChunk)
      currentOffset += chunkSize

      console.log(`Fetched Chunk in ${Date.now() - time}ms nbProcedures: ${procedures.length}`)
    }

    return procedures
  }
}

export default defineCachedFunction(async (query, filters = []) => {
  const time = Date.now()

  let procedures =  await fetchChunks(query, filters)

  console.log(`Fetched procedures in ${Date.now() - time}ms`)

  let enrichedProcedures = [];

  for (let i = 0; i < procedures.length; i++) {
    const procedure = procedures[i];
    try {
      const collectiviteId = procedure.collectivite_porteuse_id;
      if (!collectiviteId) {
          console.log(`Missing collectiviteId for procedure ID: ${procedure.id}`);
          enrichedProcedures.push(procedure); // Skip and push the original procedure if collectiviteId is missing
          continue;
      }

      const collectiviteQuery = { code: collectiviteId };
      const collectivite = collectiviteId.length > 5 ?
          await findGroupement(collectiviteQuery) :
          await findCommune(collectiviteQuery);

      if (collectivite) {
          // console.log(`Found collectivite for procedure ID: ${procedure.id}`);
          procedure.collectivite = collectivite;
          procedure.collectivite.region = await findRegion({ code: procedure.collectivite.regionCode })
          procedure.collectivite.departement = await findDepartement({ code: procedure.collectivite.departementCode })
      } else {
          // console.log(`Collectivite not found for procedure ID: ${procedure.id}`);
      }

      console.log(`Processed ${i}/${procedures.length}`)
      enrichedProcedures.push(procedure);
    } catch (err) {
      console.log(`Error processing procedure ID: ${procedure.id}`, err);
      enrichedProcedures.push(procedure); // Push the original procedure in case of error
    }
  }

  console.log(`Finished handling collectivites after ${Date.now() - time}ms`)

  enrichedProcedures = enrichedProcedures.filter(p => !!p.collectivite)

  console.log(`Finished first enriched after ${Date.now() - time}ms`)

  enrichedProcedures = await enrichProcedures(enrichedProcedures)

  console.log(`Finished second enriched after ${Date.now() - time}ms`)

  return enrichedProcedures
}, {
  name: 'getProcedures',
  maxAge: 60 * 60
})
