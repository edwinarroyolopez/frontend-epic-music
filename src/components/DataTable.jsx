import { useId, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Search, Trash2 } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext.jsx'
import { tableRows } from '../utils/table.js'

/** Shared resource table. Sorting/filtering apply only to supplied rows. */
export function DataTable({ caption, columns, rows, rowLabel, searchText, onView, onDelete, deleteDisabled = () => false, loading = false, emptyMessage, hasMore = false, className = '' }) {
  const { t } = usePreferences()
  const id = useId()
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState(null)
  const visible = tableRows(rows, columns, filter, sort, searchText)
  const changeSort = key => setSort(value => ({ key, direction: value?.key === key && value.direction === 'asc' ? 'desc' : 'asc' }))
  return <section className={`data-table ${className}`} aria-label={caption} aria-busy={loading}>
    <div className="data-table__toolbar">
      <div className="data-table__filter"><label htmlFor={id}>{t('table.filter', { name: caption })}</label>
        <div><Search size={16} aria-hidden="true" /><input id={id} type="search" value={filter} maxLength={200} onChange={event => setFilter(event.target.value)} /></div>
      </div>
      <p className="text-muted text-sm" role="status">{loading ? t('states.loading') : t('table.count', { count: visible.length, total: rows.length })}</p>
    </div>
    {hasMore && <p className="text-muted text-sm">{t('table.loadedOnly')}</p>}
    <div className="data-table__scroll">
      <table role="table">
        <caption className="sr-only">{caption}</caption>
        <thead role="rowgroup"><tr role="row">{columns.map(column => <th role="columnheader" scope="col" key={column.key}
          aria-sort={column.sortValue ? sort?.key === column.key ? sort.direction === 'asc' ? 'ascending' : 'descending' : 'none' : undefined}>
          {column.sortValue ? <button type="button" onClick={() => changeSort(column.key)} aria-label={t('table.sort', { column: column.label })}>
            {column.label}{sort?.key === column.key ? sort.direction === 'asc' ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" /> : <ArrowUpDown size={14} aria-hidden="true" />}
          </button> : column.label}
        </th>)}<th role="columnheader" scope="col" className="data-table__actions-heading">{t('table.actions')}</th></tr></thead>
        <tbody role="rowgroup">{visible.map(row => <tr role="row" key={row.id} data-row-id={row.id}>
          {columns.map(column => <td role="cell" key={column.key}><span className="data-table__mobile-label" aria-hidden="true">{column.label}</span><div>{column.render(row)}</div></td>)}
          <td role="cell" className="data-table__actions"><span className="data-table__mobile-label" aria-hidden="true">{t('table.actions')}</span><div>
            <button type="button" className="btn btn--secondary icon-action" disabled={loading} aria-label={t('table.view', { name: rowLabel(row) })} title={t('table.view', { name: rowLabel(row) })} onClick={() => onView(row)}><Eye size={18} aria-hidden="true" /></button>
            <button type="button" className="btn btn--secondary icon-action icon-action--danger" disabled={loading || deleteDisabled(row)} aria-label={t('table.delete', { name: rowLabel(row) })} title={t('table.delete', { name: rowLabel(row) })} onClick={() => onDelete(row)}><Trash2 size={18} aria-hidden="true" /></button>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    {!loading && !visible.length && <p className="data-table__empty">{rows.length ? t('table.noMatches') : emptyMessage}</p>}
  </section>
}
