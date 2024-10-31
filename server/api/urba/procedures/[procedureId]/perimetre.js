export default defineCachedEventHandler(async (event) => {
  const procedureId = getRouterParam(event, 'procedureId')

  const {data: perim} = await supabase.from('procedures_perimetres').select('*')
    .eq('procedure_id', procedureId)

  return perim
}, {
  name: 'proceduresPerimetre',
  maxAge: 60 * 60
})
