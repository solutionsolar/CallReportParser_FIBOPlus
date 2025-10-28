export interface FiboItem {
  name: string;
  fibo_class: string;
  description: string;
  context: string;
}

export interface FinancialDataItem {
  name: string;
  value: string;
  ontology_class: string;
  description: string;
  context: string;
}

export interface FiboData {
  concepts: FiboItem[];
  entities: FiboItem[];
  relationships: FiboItem[];
  financial_data: FinancialDataItem[];
}
