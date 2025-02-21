import _ from 'lodash'
import enrichProcedures from './enrichProcedures';

export default async function (query) {
  const filteredCommunes = await getCommunes(Object.assign({
    type: 'COM'
  }, query))
  
  const procedures = await fetchCommunesProcedures(filteredCommunes.map(c => c.code))

  const time = Date.now()
  const communes = [];

  console.time(`enrichProcedures`)
  let enrichedProcedures = await enrichProcedures(procedures)
  // Procedures with no prescriptions should not be in exports.
  enrichedProcedures = enrichedProcedures.filter(p => !!p.prescription)
  console.timeEnd(`enrichProcedures`)



  for (let i = 0; i < filteredCommunes.length; i++) {
    // const filterTime = Date.now()
    const commune = filteredCommunes[i];
    const communeProcedures = enrichedProcedures.filter(p => {
      return !!p.procedures_perimetres.find(c => c.collectivite_code === commune.code);
    })

    // console.log('Filter procedure in', (Date.now() - filterTime) / 1000)

    const enrichedCommune = await getCommuneProcedures(commune, communeProcedures)
    communes.push(enrichedCommune);
  }

  console.log('finished enrichement', communes.length, (Date.now() - time) / 1000)

  return communes
}