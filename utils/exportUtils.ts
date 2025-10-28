import { FiboData, FiboItem, FinancialDataItem } from '../types';

/**
 * Escapes a string for use in a CSV cell.
 * If the cell contains a comma, newline, or double quote, it will be enclosed in double quotes.
 * Existing double quotes within the cell will be escaped by doubling them.
 * @param cell - The string to escape.
 * @returns The escaped string, ready for CSV.
 */
function escapeCsvCell(cell: string): string {
  if (cell == null) {
    return '';
  }
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts FiboData object into a single CSV formatted string.
 * @param data - The FiboData object.
 * @returns A string representing the data in CSV format.
 */
export function convertToCsv(data: FiboData): string {
  if (!data) return '';
  
  const headers = ['type', 'name', 'value', 'ontology_class', 'description', 'context'];
  const allRows: string[][] = [];

  const createFinancialDataRows = (items: FinancialDataItem[] | undefined) => {
    if (!items) return;
    items.forEach(item => {
      allRows.push([
        escapeCsvCell('Financial Data'),
        escapeCsvCell(item.name),
        escapeCsvCell(item.value),
        escapeCsvCell(item.ontology_class),
        escapeCsvCell(item.description),
        escapeCsvCell(item.context),
      ]);
    });
  };

  const createFiboRows = (items: FiboItem[] | undefined, type: string) => {
    if (!items) return;
    items.forEach(item => {
      allRows.push([
        escapeCsvCell(type),
        escapeCsvCell(item.name),
        '', // value
        escapeCsvCell(item.fibo_class), // mapped to ontology_class column
        escapeCsvCell(item.description),
        escapeCsvCell(item.context),
      ]);
    });
  };

  createFinancialDataRows(data.financial_data);
  createFiboRows(data.concepts, 'Concept');
  createFiboRows(data.entities, 'Entity');
  createFiboRows(data.relationships, 'Relationship');

  const csvContent = [
    headers.join(','),
    ...allRows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}
