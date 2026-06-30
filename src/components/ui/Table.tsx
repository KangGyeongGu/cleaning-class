type TableProps = React.TableHTMLAttributes<HTMLTableElement>;
type SectionProps = React.HTMLAttributes<HTMLTableSectionElement>;
type RowProps = React.HTMLAttributes<HTMLTableRowElement>;
type CellProps = React.TdHTMLAttributes<HTMLTableCellElement>;
type HeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement>;

export function Table({
  className = "",
  children,
  ...props
}: TableProps): React.ReactElement {
  return (
    <table className={`w-full text-sm ${className}`.trim()} {...props}>
      {children}
    </table>
  );
}

export function Thead({
  className = "",
  children,
  ...props
}: SectionProps): React.ReactElement {
  return (
    <thead className={`bg-slate-50 ${className}`.trim()} {...props}>
      {children}
    </thead>
  );
}

export function Tbody({
  className = "",
  children,
  ...props
}: SectionProps): React.ReactElement {
  return (
    <tbody
      className={`divide-y divide-slate-100 ${className}`.trim()}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function Tr({
  className = "",
  children,
  ...props
}: RowProps): React.ReactElement {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export function Th({
  className = "",
  children,
  ...props
}: HeaderCellProps): React.ReactElement {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-500 uppercase ${className}`.trim()}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  className = "",
  children,
  ...props
}: CellProps): React.ReactElement {
  return (
    <td className={`px-4 py-3 ${className}`.trim()} {...props}>
      {children}
    </td>
  );
}
