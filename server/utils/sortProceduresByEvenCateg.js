import dayjs from 'dayjs'

export default function sortProceduresByEvenCateg(procedures, eventCateg) {
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