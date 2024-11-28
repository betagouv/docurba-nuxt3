import _ from 'lodash'
import dayjs from 'dayjs'

function sortEvents(events) {
  return events.sort((a, b) => {
    return +dayjs(a.date_iso) - +dayjs(b.date_iso)
  })
}

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
  publicationPerim: ['Publication de périmètre', 'Publication périmètre'],
  exec: ['Caractère exécutoire'],
  fin: ["Fin d'échéance"]
}

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

// This assume that events are sorted in chronological order
function findEventByType(events, types) {
  return events.find(e => types.includes(e.type))
}

export default async function (procedures) {
    const enrichedProcedures = [];

    for (let i = 0; i < procedures.length; i++) {
        const procedure = procedures[i];
        if (procedure.archived) {
            continue; // Skip archived procedures
        }

        // console.time(`sort Events`)
        const eventsByType = {};
        const events = procedure.events || sortEvents(procedure.doc_frise_events);
        events.forEach(e => e.year = dayjs(e.date_iso).year());
        // console.timeEnd(`sort Events`)

        // console.time(`find Events type`)
        Object.keys(eventsCategs).forEach((key) => {
            eventsByType[key] = findEventByType(events, eventsCategs[key]);

            // Add year
            if (eventsByType[key]) {
                eventsByType[key].year = dayjs(eventsByType[key].date_iso).year();
            }
        });

        if (eventsByType.prescription && eventsByType.approbation) {
            eventsByType.approbationDelay = dayjs(eventsByType.approbation.date_iso)
                .diff(eventsByType.prescription.date_iso, 'day');
        }
        // console.timeEnd(`find Events type`)

        // console.time('find Groupement')
        const groupement = await findGroupement({ code: procedure.collectivite_porteuse_id });
        // console.timeEnd(`find Groupement`)

        // console.time('filter perim')
        const perim = procedure.procedures_perimetres.filter(c => c.collectivite_type === 'COM');
        // console.timeEnd('filter perim')

        // console.time('list dept')
        const departements = _.uniq(perim.map(p => p.departement));
        // console.timeEnd(`list dept`)

        // console.time('object assign')
        const enrichedProcedure = Object.assign({
            communesPerimetres: perim,
            departements,
            isInterDepartemental: departements.length > 1,
            isSectoriel: groupement ? groupement.membres.filter(m => m.type === 'COM').length > perim.length : false,
        }, eventsByType, procedure)

        enrichedProcedure.docType = getFullDocType(enrichedProcedure)
        // console.timeEnd('object assign')

        enrichedProcedures.push(enrichedProcedure); // Add enriched procedure to the list
    }

    return enrichedProcedures;
}
