import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityGrid } from "../components/EntityGrid";
import type { ColumnConfig, EntityRecord } from "../types";

const columns: ColumnConfig[] = [
  { key: "id", label: "ID", dataType: "number", sortable: true },
  { key: "name", label: "Имя", sortable: true },
];

const noop = vi.fn();

const baseProps = {
  columns,
  rows: [] as EntityRecord[],
  loading: false,
  error: "",
  search: "",
  onSearchChange: noop,
  sortKey: "id",
  sortDirection: "desc" as const,
  onSort: noop,
  limit: 20,
  offset: 0,
  total: 0,
  hasMore: false,
  onLimitChange: noop,
  onOffsetChange: noop,
  onRefresh: noop,
  onCreate: noop,
  onView: noop,
  onEdit: noop,
  onDelete: noop,
  getRowKey: (row: EntityRecord) => String(row.id),
};

describe("EntityGrid", () => {
  it("shows loading state", () => {
    render(<EntityGrid {...baseProps} loading />);
    expect(screen.getAllByText("Загрузка...").length).toBeGreaterThan(0);
  });

  it("shows error state", () => {
    render(<EntityGrid {...baseProps} error="Ошибка загрузки" />);
    expect(screen.getByText("Ошибка загрузки")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<EntityGrid {...baseProps} />);
    expect(screen.getAllByText("Нет данных").length).toBeGreaterThan(0);
  });

  it("renders rows and localized actions", () => {
    render(
      <EntityGrid
        {...baseProps}
        rows={[{ id: 1, name: "Aidar" }]}
        total={1}
      />,
    );

    expect(screen.getAllByText("Aidar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Просмотр").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Изменить").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Удалить").length).toBeGreaterThan(0);
  });
});
