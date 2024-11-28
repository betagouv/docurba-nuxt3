import _ from 'lodash'

const proceduresCategs = {
  revision: ['Révision', 'Révision allégée (ou RMS)', 'Révision simplifiée'],
  modification: ['Modification', 'Modification simplifiée']
}

function logProcedures(procedures, logName = 'logProcedures') {
  return console.log(logName, procedures.map(p => `${p.id} ${p.doc_type} ${p.type} ${p.prescription?.date_iso} ${p.procedures_perimetres.length}: ${p.events.length}`))
}

function filterProcedures(procedures) {
  const proceduresByStatus = _.groupBy(procedures, 'status')

  const opposables = proceduresByStatus['opposable'] || []
  const currents = (proceduresByStatus['en cours'] || []).filter((p) => {
    return p.from_sudocuh ? !!p.prescription : true
  })

  return {
    opposables: sortProceduresByEvenCateg(opposables, 'prescription'),
    currents: sortProceduresByEvenCateg(currents, 'prescription')
  }
}

async function getCommuneMetadata(commune) {
  const departement = await findDepartement({ code: commune.departementCode })
  const region = await findRegion({ code: commune.regionCode })
  const groupement = await findGroupement({ code: commune.intercommunaliteCode })

  let intercommunalite = null
  if (groupement) {
    intercommunalite = Object.assign({
      region: await findRegion({ code: groupement.regionCode }),
      departement: await findDepartement({ code: groupement.departementCode })
    }, groupement)

    delete departement.communes
    delete intercommunalite.membres
    delete intercommunalite.departement.communes
  }

  return Object.assign({
    cog: '2024',
    nouvelle: await isCommuneNouvelle(commune.code),
    intercommunalite,
    departement,
    region
  }, commune)
}

async function enrichCommune(commune, enrichedProcedures) {
  // < 1ms so max 400ms on a departement.
  // console.time(`getCommuneMetadata ${commune.code}`)
  const enrichedCommune = await getCommuneMetadata(commune)
  // console.timeEnd(`getCommuneMetadata ${commune.code}`)

  // 0.4s on average. Decided to enrich procedure in batch to avoid enriching same procedure multiple times.
  // console.time(`enrichProcedures ${commune.code}`)
  // const enrichedProcedures = await enrichProcedures(procedures)
  // console.timeEnd(`enrichProcedures ${commune.code}`)

  enrichedProcedures.forEach(p => {
    p.isSelfPorteuse = p.collectivite_porteuse_id === commune.code
  })

  const {
    opposables: scotOpposables,
    currents: scotCurrents
  } = filterProcedures(enrichedProcedures.filter(p => p.doc_type === 'SCOT'), true)

  const scotOpposable = scotOpposables[0]
  const scotCurrent = scotCurrents[0]

  const {
    opposables: planOpposables,
    currents: planCurrents
  } = filterProcedures(enrichedProcedures.filter(p => p.doc_type !== 'SCOT'))

  // logProcedures(planOpposables, 'planOpposables')
  // logProcedures(planCurrents, 'planCurrents')

  const revisions = planCurrents.filter(p => proceduresCategs.revision.includes(p.type))
  const modifications = planCurrents.filter(p => proceduresCategs.modification.includes(p.type))

  const planOpposable = planOpposables[0]
  // Add a specific filter: PLU cannot be current if there is a opposable PLUi.
  const planCurrent = planCurrents.filter((p) => {
    return (planOpposable && planOpposable.communesPerimetres.length > 1) ? p.communesPerimetres.length > 1 : true
  })[0]

  const collectivitePorteuse = (planCurrent || planOpposable)?.collectivite_porteuse_id || commune.code

  let porteuse = collectivitePorteuse.length > 5 ? await findGroupement({ code: collectivitePorteuse }) : Object.assign({}, commune)

  if (!porteuse) {
    for (const i in commune.groupements) {
      const group = await findGroupement({ code: commune.groupements[i].siren, competencePLU: true })
      if (group) {
        porteuse = group
        break
      }
    }
  }

  porteuse.siren = collectivitePorteuse.length > 5 ? collectivitePorteuse : ''
  porteuse.insee = collectivitePorteuse.length > 5 ? '' : collectivitePorteuse
  porteuse.departement = await findDepartement({ code: porteuse.departementCode })

  const sCodes = await getSudocuhCodes(planOpposable, planCurrent, collectivitePorteuse)

  const currentsDocTypes = JSON.stringify(_.uniq(planCurrents.map(p => p.docType)))

  return Object.assign({
    scotOpposable,
    scotCurrent,
    planOpposable,
    planCurrent,
    planCurrents,
    revisions,
    modifications,
    collectivitePorteuse,
    porteuse,
    sudocuhCodes: sCodes,
    currentsDocTypes
  }, enrichedCommune)
}

export default async function (commune, enrichedProcedures) {
  // const time = Date.now()
  const enrichedCommune = await enrichCommune(commune, enrichedProcedures)
  // console.log('finished enrichement', commune.code, (Date.now() - time) / 1000)
  return enrichedCommune

}
