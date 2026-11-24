type AccessibleChartTableProps = {
  caption: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

export default function AccessibleChartTable({
  caption,
  headers,
  rows,
}: AccessibleChartTableProps) {
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row[0]}`}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={`${cellIndex}-${cell}`} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={`${cellIndex}-${cell}`}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
