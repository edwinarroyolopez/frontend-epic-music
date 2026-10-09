const normalize = value => String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim()
export function tableRows(rows, columns, filter, sort, searchText) {
  const needle = normalize(filter)
  const visible = rows.filter(row => !needle || normalize(searchText(row)).includes(needle))
  const column = columns.find(value => value.key === sort?.key)
  if (!column?.sortValue) return visible
  return visible.map((row, index) => ({ row, index })).sort((a, b) => {
    const left = column.sortValue(a.row), right = column.sortValue(b.row)
    const compared = typeof left === 'number' && typeof right === 'number' ? left - right : normalize(left).localeCompare(normalize(right))
    return (sort.direction === 'desc' ? -compared : compared) || a.index - b.index
  }).map(value => value.row)
}
