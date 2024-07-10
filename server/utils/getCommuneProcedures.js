import _ from 'lodash'
import dayjs from 'dayjs'

const eventsCategs = {
  approbation: ["Délibération d'approbation", "Arrêté d'abrogation", "Arrêté du Maire ou du Préfet ou de l'EPCI", 'Approbation du préfet'],
  arret: ['Arrêt de projet'],
  pac: ['Porter à connaissance'],
  deliberation: ["Délibération de l'Etab Pub sur les modalités de concertation", "Délibération de l'Etablissement Public"],
  pacComp: ['Porter à connaissance complémentaire'],
  prescription: [
    'Prescription',
    "Délibération de prescription du conseil municipal ou communautaire",
    "Délibération de prescription du conseil municipal",
    "Delibération de l'établissement public", "Délibération de l'Etablissement Public", // SCOT
    'Publication de périmètre', 'Publication périmètre' // SCOT
  ],
  exec: ['Caractère exécutoire'],
  fin: ["Fin d'échéance"]
}

const proceduresCategs = {
  revision: ['Révision', 'Révision allégée (ou RMS)', 'Révision simplifiée'],
  modification: ['Modification', 'Modification simplifiée']
}

// function logProcedures(procedures, logName = 'logProcedures') {
//   return console.log(logName, procedures.map(p => `${p.id} ${p.doc_type} ${p.type} ${p.prescription?.date_iso} ${p.procedures_perimetres.length}: ${p.events.length}`))
// }

function getFullDocType(procedure) {
  if (procedure.doc_type === 'PLU') {
    let docType = procedure.doc_type
    if (procedure.communesPerimetres.length > 1) {
      docType += 'i'
      if (procedure.isSectoriel && (procedure.status === 'opposable' || procedure.status === 'en cours')) {
        docType += 's'
      }
    }

    return docType
  } else { return procedure.doc_type }
}

function sortProceduresByEvenCateg(procedures, eventCateg) {
  // ASK CLAIRE: Quelle est la règle si CC en cour + PLUi en cours.
  // return orderBy(procedures, [
  //   p => p.procedures_perimetres.length,
  //   p => p[eventCateg]?.date_iso
  // ], ['desc', 'desc'])

  return procedures.sort((a, b) => {
    const dateA = a[eventCateg] ? +dayjs(a[eventCateg].date_iso) : 0
    const dateB = b[eventCateg] ? +dayjs(b[eventCateg].date_iso) : 0

    return dateB - dateA
  })
}

// This assume that events are sorted in chronological order
function findEventByType(events, types) {
  return events.find(e => types.includes(e.type))
}

function filterProcedures(procedures) {
  const sortedProcedures = sortProceduresByEvenCateg(procedures, 'prescription')

  let opposables = sortedProcedures.filter(p => p.status === 'opposable')
  opposables = sortProceduresByEvenCateg(opposables, 'prescription')

  let currents = sortedProcedures.filter(p => p.status === 'en cours').filter((p) => {
    return p.from_sudocuh ? !!p.prescription : true
  })
  currents = sortProceduresByEvenCateg(currents, 'prescription')

  return { procedures: sortedProcedures, opposables, currents }
}

async function enrichProcedures(inseeCode, procedures) {
  return await Promise.all(procedures.filter(p => !p.archived).map(async (procedure) => {
    const eventsByType = {}

    Object.keys(eventsCategs).forEach((key) => {
      eventsByType[key] = findEventByType(procedure.events, eventsCategs[key])
    })

    if (eventsByType.prescription && eventsByType.approbation) {
      eventsByType.approbationDelay = dayjs(eventsByType.approbation.date_iso).diff(eventsByType.prescription.date_iso, 'day')
    }

    const groupement = await findGroupement({ code: procedure.collectivite_porteuse_id })
    const perim = procedure.procedures_perimetres.filter(c => c.collectivite_type === 'COM')

    const enrichedProcedure = Object.assign({
      communesPerimetres: perim,
      isSelfPorteuse: procedure.collectivite_porteuse_id === inseeCode,
      isSectoriel: groupement ? groupement.membres.filter(m => m.type === 'COM').length > perim.length : false
    }, eventsByType, procedure)

    enrichedProcedure.docType = getFullDocType(enrichedProcedure)

    return enrichedProcedure
  }))
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

async function enrichCommune(commune, procedures) {
  const enrichedCommune = await getCommuneMetadata(commune)
  const enrichedProcedures = await enrichProcedures(commune.code, procedures)

  const {
    procedures: scots,
    opposables: scotOpposables,
    currents: scotCurrents
  } = filterProcedures(enrichedProcedures.filter(p => p.doc_type === 'SCOT'))

  const scotOpposable = scotOpposables[0]
  const scotCurrent = scotCurrents[0]

  const {
    procedures: plans,
    opposables: planOpposables,
    currents: planCurrents
  } = filterProcedures(enrichedProcedures.filter(p => p.doc_type !== 'SCOT'))

  const revisions = planCurrents.filter(p => proceduresCategs.revision.includes(p.type))
  const modifications = planCurrents.filter(p => proceduresCategs.modification.includes(p.type))

  const planOpposable = planOpposables[0]
  // Add a specific filter: PLU cannot be current if there is a opposable PLUi.
  const planCurrent = planCurrents.filter((p) => {
    return (planOpposable && planOpposable.communesPerimetres.length > 1) ? p.communesPerimetres.length > 1 : true
  })[0]

  const collectivitePorteuse = (planCurrent || planOpposable)?.collectivite_porteuse_id || commune.code

  let porteuse = collectivitePorteuse.length > 5 ? await findGroupement({ code: collectivitePorteuse }) : await findCommune({ type: 'COM', code: collectivitePorteuse })

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
    revisions,
    modifications,
    collectivitePorteuse,
    porteuse,
    sudocuhCodes: sCodes,
    currentsDocTypes
  }, enrichedCommune)
}

export default async function (commune, procedures) {
  const time = Date.now()
  const enrichedCommune = await enrichCommune(commune, procedures)

  console.log('finished enrichement', commune.code, (Date.now() - time) / 1000)

  return enrichedCommune
}
