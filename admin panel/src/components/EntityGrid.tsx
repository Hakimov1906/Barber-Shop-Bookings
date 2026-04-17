import type { ColumnConfig, EntityRecord, SortDirection } from "../types";
import { formatCellValue } from "../utils/format";

type EntityGridProps = {
  columns: ColumnConfig[];
  rows: EntityRecord[];
  loading: boolean;
  error?: string;
  search: string;
  onSearchChange: (value: string) => void;
  sortKey: string;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  onLimitChange: (next: number) => void;
  onOffsetChange: (next: number) => void;
  onRefresh: () => void;
  onCreate: () => void;
  onView: (row: EntityRecord) => void;
  onEdit: (row: EntityRecord) => void;
  onDelete: (row: EntityRecord) => void;
  getRowKey: (row: EntityRecord) => string;
};

function SortBadge({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <span className="sort-badge">↕</span>;
  return <span className="sort-badge">{direction === "asc" ? "↑" : "↓"}</span>;
}

function renderCellValue(column: ColumnConfig, row: EntityRecord) {
  if (column.render) return column.render(row);
  return formatCellValue(row[column.key], column.dataType || "text");
}

function RowActions({
  row,
  onView,
  onEdit,
  onDelete,
}: {
  row: EntityRecord;
  onView: (row: EntityRecord) => void;
  onEdit: (row: EntityRecord) => void;
  onDelete: (row: EntityRecord) => void;
}) {
  return (
    <div className="row-actions">
      <button type="button" className="ghost tiny" onClick={() => onView(row)}>
        Просмотр
      </button>
      <button type="button" className="ghost tiny" onClick={() => onEdit(row)}>
        Изменить
      </button>
      <button type="button" className="danger tiny" onClick={() => onDelete(row)}>
        Удалить
      </button>
    </div>
  );
}

export function EntityGrid({
  columns,
  rows,
  loading,
  error,
  search,
  onSearchChange,
  sortKey,
  sortDirection,
  onSort,
  limit,
  offset,
  total,
  hasMore,
  onLimitChange,
  onOffsetChange,
  onRefresh,
  onCreate,
  onView,
  onEdit,
  onDelete,
  getRowKey,
}: EntityGridProps) {
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = offset + rows.length;

  return (
    <section className="entity-grid-panel">
      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Поиск по текущей странице"
          />
        </div>
        <div className="toolbar-actions">
          <button type="button" className="ghost" onClick={onRefresh} disabled={loading}>
            Обновить
          </button>
          <button type="button" onClick={onCreate}>
            + Создать
          </button>
        </div>
      </div>

      {error ? <div className="panel-error">{error}</div> : null}

      <div className="table-view">
        <div className="table-scroll">
          <table className="entity-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={{ width: column.width }}>
                    <button
                      type="button"
                      className={`sort-button ${column.sortable ? "sortable" : ""}`}
                      onClick={() => column.sortable && onSort(column.key)}
                      disabled={!column.sortable}
                    >
                      {column.label}
                      <SortBadge active={sortKey === column.key} direction={sortDirection} />
                    </button>
                  </th>
                ))}
                <th style={{ width: "265px" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="placeholder-row">
                    Загрузка...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={getRowKey(row)}>
                    {columns.map((column) => (
                      <td key={`${getRowKey(row)}:${column.key}`}>{renderCellValue(column, row)}</td>
                    ))}
                    <td>
                      <RowActions row={row} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className="placeholder-row">
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-view">
        {loading ? (
          <div className="placeholder-card">Загрузка...</div>
        ) : rows.length ? (
          <div className="mobile-card-list">
            {rows.map((row) => (
              <article key={getRowKey(row)} className="entity-card">
                <dl className="entity-card-fields">
                  {columns.map((column) => (
                    <div className="entity-card-field" key={`${getRowKey(row)}:mobile:${column.key}`}>
                      <dt>{column.label}</dt>
                      <dd>{renderCellValue(column, row)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="card-actions">
                  <RowActions row={row} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="placeholder-card">Нет данных</div>
        )}
      </div>

      <div className="pagination">
        <div>
          Показано: {pageStart}-{pageEnd} из {total}
        </div>
        <div className="pagination-actions">
          <label>
            Лимит
            <select value={String(limit)} onChange={(event) => onLimitChange(Number(event.target.value))}>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <button
            type="button"
            className="ghost"
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
            disabled={offset === 0 || loading}
          >
            Назад
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => onOffsetChange(offset + limit)}
            disabled={!hasMore || loading}
          >
            Далее
          </button>
        </div>
      </div>
    </section>
  );
}
