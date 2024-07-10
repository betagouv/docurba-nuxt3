const codeEtaMap = {
  RNU: '9',
  CC: '1',
  POS: '2',
  PLU: '3',
  PLUi: '3',
  PLUiH: '3'
}

const codeEtatsLabels = {
  99: 'RNU ',
  91: 'CC en élaboration ',
  92: 'POS en élaboration ',
  93: 'PLU en élaboration',
  19: 'CC approuvée ',
  11: 'CC en révision ',
  13: 'CC approuvée – PLU en élaboration ',
  29: 'POS approuvé',
  21: 'POS approuvé - CC en élaboration',
  22: 'POS en révision ',
  23: 'POS approuvé - PLU en révision',
  39: 'PLU approuvé',
  31: 'PLU approuvé - CC en élaboration',
  33: 'PLU en révision'
}

function getProcedureType(procedure) {
  return procedure ? (procedure.doc_type || 'RNU') : 'RNU'
}

async function getProcedureCode2(procedure, porteuseId) {
  if (!procedure || !procedure.communesPerimetres || !procedure.communesPerimetres.length) {
    // Pas de communes
    return '9'
  } else if (procedure.communesPerimetres.length > 1) {
    const group = await findGroupement({ code: porteuseId })
    const isSectoriel = group ? group.membres.filter(m => m.type === 'COM').length > procedure.communesPerimetres.length : procedure.is_sectoriel

    if (isSectoriel) {
      // if (procedure.is_sectoriel) {
      return '3'
    } else {
      return '2'
    }
  } else {
    return '1'
  }
}

async function getCodeComp(procedure, porteuseId) {
  if (!procedure || !procedure.collectivite_porteuse_id) { return '9' }

  const isEPCI = porteuseId.length > 5

  if (isEPCI) {
    if (procedure.communesPerimetres.length > 1) {
      const group = await findGroupement({ code: porteuseId })
      const isSectoriel = group ? group.membres.filter(m => m.type === 'COM').length > procedure.communesPerimetres.length : procedure.is_sectoriel
      if (isSectoriel) {
        return '3'
      }

      return '2'
    } else {
      return '4'
    }
  } else { return '1' }
}

function getCodeEtat(planOpposable, planCurrent) {
  const code = `${codeEtaMap[getProcedureType(planOpposable)]}${codeEtaMap[getProcedureType(planCurrent)]}`
  return {
    code,
    label: codeEtatsLabels[code]
  }
}

async function getCodeEtat2(planOpposable, planCurrent, collectivitePorteuse) {
  const opposableCode = `${codeEtaMap[getProcedureType(planOpposable)]}${await getProcedureCode2(planOpposable, collectivitePorteuse)}`
  const currentCode = `${codeEtaMap[getProcedureType(planCurrent)]}${await getProcedureCode2(planCurrent, collectivitePorteuse)}`

  return { code: `${opposableCode}${currentCode}`, label: '' }
}

async function getCodeBcsi(planOpposable, planCurrent, collectivitePorteuse) {
  // console.log(getProcedureType(planOpposable), planOpposable)

  const codeOpposable = `${codeEtaMap[getProcedureType(planOpposable)]}${await getCodeComp(planOpposable, collectivitePorteuse)}`
  const codeEnCour = `${codeEtaMap[getProcedureType(planCurrent)]}${await getCodeComp(planCurrent, collectivitePorteuse)}`

  const code = `${codeOpposable}${codeEnCour}`
  const bcsi = await findSudocuhBCSI(code)

  return {
    code,
    label: bcsi?.Lib_EtatD
  }
}

export default async function (planOpposable, planCurrent, collectivitePorteuse) {
  return {
    etat: getCodeEtat(planOpposable, planCurrent),
    etat2: await getCodeEtat2(planOpposable, planCurrent, collectivitePorteuse),
    bcsi: await getCodeBcsi(planOpposable, planCurrent, collectivitePorteuse)
  }
}
