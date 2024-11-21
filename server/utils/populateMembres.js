export default async function populateMembres (membres) {
  const populatedList = []

  for (let index = 0; index < membres.length; index++) {
    const membre = membres[index]

    if(membre.code.length > 5) {
      const groupements = await searchGroupements({code: membre.code})
      const groupement = groupements[0]

      const groupementMembres = await populateMembres(groupement.membres)

      populatedList.push(...groupementMembres)
    } else {
      populatedList.push(membre)
    }
  }

  return populatedList
}