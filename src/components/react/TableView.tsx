import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Note } from "../../utils/filterNotes";
import type { BaseView } from "../../utils/bases/types";
import {
  getPropertyValue,
  formatPropertyValue,
} from "../../utils/bases/filter";

interface TableViewProps {
  notes: Note[];
  view: BaseView;
  baseName: string;
}

function getColumnName(propertyName: string): string {
  if (propertyName.startsWith("file.")) {
    const name = propertyName.substring(5);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  if (propertyName.startsWith("formula.")) {
    return propertyName.substring(8);
  }
  return propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
}

export function TableView({
  notes,
  view,
  baseName: _baseName,
}: TableViewProps) {
  const columnOrder = view.order || ["file.name", "file.mtime"];

  const columns = useMemo<ColumnDef<Note>[]>(
    () =>
      columnOrder.map((column, _index) => ({
        id: column,
        header: getColumnName(column),
        accessorFn: (row) => getPropertyValue(row, column),
        size: undefined,
        cell: (info) => {
          const note = info.row.original;
          const value = info.getValue();
          const formatted = formatPropertyValue(value);

          if (column === "file.name") {
            return (
              <a
                href={`/${note.slug}`}
                className="font-medium no-underline hover:underline"
                style={{ color: "var(--color-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-tertiary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-secondary)")
                }
              >
                {formatted || note.data.title || note.slug}
              </a>
            );
          }

          if (column === "file.tags" || column === "tags") {
            return Array.isArray(value) && value.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {value.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                    style={{
                      color: "var(--color-light)",
                      background: "var(--color-tertiary)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="italic" style={{ color: "var(--color-gray)" }}>
                —
              </span>
            );
          }

          return (
            formatted || (
              <span className="italic" style={{ color: "var(--color-gray)" }}>
                —
              </span>
            )
          );
        },
      })),
    [columnOrder],
  );

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (notes.length === 0) {
    return (
      <div
        className="text-center py-12 px-4 italic"
        style={{ color: "var(--color-darkgray)" }}
      >
        <p>No notes match the current filters.</p>
      </div>
    );
  }

  return (
    <table className="table w-full border-collapse text-sm">
      <thead
        className="sticky top-0 z-10"
        style={{
          background: "var(--color-lightgray)",
          borderBottom: "1px solid var(--color-gray)",
        }}
      >
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="text-left px-3 py-2 font-semibold text-[0.8125rem] whitespace-nowrap relative"
                style={{ color: "var(--color-dark)" }}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="border-b"
            style={{ borderColor: "var(--color-lightgray)" }}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="px-3 py-2 align-middle whitespace-nowrap"
                style={{ color: "var(--color-darkgray)" }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
