export default async function (query) {
  const filteredCommunes = await getCommunes(Object.assign({
    type: 'COM'
  }, query))
  
  const procedures = await fetchCommunesProcedures(filteredCommunes.map(c => c.code))

  const time = Date.now()
  const communes = [];

  for (let i = 0; i < filteredCommunes.length; i++) {
    const commune = filteredCommunes[i];
    const communeProcedures = procedures.filter(p => {
      return !!p.procedures_perimetres.find(c => c.collectivite_code === commune.code);
    })

    const enrichedCommune = await getCommuneProcedures(commune, communeProcedures)
    communes.push(enrichedCommune);
  }

  console.log('finished enrichement', communes.length, (Date.now() - time) / 1000)

  return communes
}