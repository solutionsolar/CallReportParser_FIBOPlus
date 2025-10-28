# CallReportParser — FIBOPlus

> A TypeScript + Vite utility for parsing bank Call Report PDFs, extracting text and structured data, and mapping to a financial ontology (FIBO + custom Call Report classes) for downstream vector/RAG workflows.

## 🚀 Overview  
This tool handles the full pipeline for analyzing bank Call Reports:

1. **PDF text extraction** — using the browser environment and `pdfjsLib` to read PDF files and extract page‑by‑page text.  
2. **Chunking** — large document text is split into manageable pieces (default ~15,000 characters) to stay within LLM context limits.  
3. **Ontology mapping**  
   - *FIBO mapping*: Identify concepts, entities and relationships (e.g., financial institutions, instruments, risk events) and link them to a FIBO class.  
   - *Financial data extraction*: Extract specific numeric / percentage / date data points (assets, liabilities, income, risk metrics) and map them to a custom “Call Report Ontology” (prefix `cr‑`).  
4. **Deduplication** — Remove duplicate items (by name + class + context) so that the result set is clean and lean.  
5. **Structured JSON output** — Ready for ingestion into embedding/vector stores, search indices, RAG pipelines or downstream data systems.

## 🧰 Architecture & Key Files  
### PDF extraction  
- `pdfService.ts` — reads a `File` object (in the browser) using `FileReader`, then uses `pdfjsLib.getDocument(...)` to load the PDF, iterates pages, extracts text, and returns a `string`.  
- Assumes that `window.pdfjsLib` is available (for example via a `<script>` tag in `index.html`).  
### Ontology mapping  
- `services/geminiService.ts` — the core logic that:  
  - Accepts raw document text and a `onProgress` callback.  
  - Splits the text into chunks (using `chunkText`) of size defined by `CHUNK_SIZE` (default: 15,000 characters).  
  - For each chunk, prompts the Google GenAI model (via `@google/genai`) with a schema definition describing the output.  
  - Receives JSON output, parses into `FiboData`, and aggregates arrays: `concepts`, `entities`, `relationships`, `financial_data`.  
  - Deduplicates each array using composite keys (name/class/context or value/class/context).  
  - Returns a `FiboData` object (see interfaces below).  
### Types / Interfaces  
Defined in `types.ts` (or similar):  
```ts
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
```
### Schema definitions (within the code)  
- `fiboItemSchema` — defines JSON schema for `FiboItem` objects: `{ name, fibo_class, description, context }`  
- `financialDataItemSchema` — defines JSON schema for `FinancialDataItem` objects: `{ name, value, ontology_class, description, context }`  
- `fiboSchema` — top‐level schema for the entire output object (`FiboData`) containing arrays: `concepts`, `entities`, `relationships`, `financial_data`  
### Constants & Configuration  
- `CHUNK_SIZE = 15000` characters  
- `API_KEY` environment variable required (`process.env.API_KEY`) for the Google GenAI integration  
- Deduplication logic uses a `Map<string, …>` keyed on composite string like `name|class|context` to eliminate duplicates.

## 🧭 Getting Started  
### Prerequisites  
- Node.js (LTS recommended)  
- A valid Google GenAI API key stored as an environment variable named `API_KEY`:

```bash
export API_KEY="YOUR_GOOGLE_GENAI_KEY"
```

### Install  
```bash
npm install
# or
yarn install
```

### Run (development)  
```bash
npm run dev
```

### Example Usage  
```ts
import { extractTextFromPdf } from './utils/extractTextFromPdf';
import { applyFiboOntology } from './services/applyFiboOntology';

const file: File = /* obtained from file‑input */;
const text = await extractTextFromPdf(file);

const result = await applyFiboOntology(text, (msg) => console.log(msg));

console.log(JSON.stringify(result, null, 2));
```

## 📄 Output Schema  
The resulting JSON object has the shape defined by `FiboData`:

```json
{
  "concepts": [
    {
      "name": "Interest Rate Risk",
      "fibo_class": "fibo‑risk‑fi:InterestRateRisk",
      "description": "...",
      "context": "..."
    }
  ],
  "entities": [
    {
      "name": "Acme Bank",
      "fibo_class": "fibo‑fbc‑fi‑fi:FinancialInstitution",
      "description": "...",
      "context": "..."
    }
  ],
  "relationships": [
    {
      "name": "Acme Bank lends to Beta Corp",
      "fibo_class": "fibo‑fbc‑fi‑fi:LendingRelationship",
      "description": "...",
      "context": "..."
    }
  ],
  "financial_data": [
    {
      "name": "Total Assets",
      "value": "$1,234,567,890",
      "ontology_class": "cr‑assets:TotalAssets",
      "description": "The bank’s total assets as of reporting date.",
      "context": "..."
    }
  ]
}
```

### Custom Call Report Ontology (prefix `cr‑`)  
- **Assets**: `cr‑assets:TotalAssets`, `cr‑assets:CashAndBalancesDue`, `cr‑assets:LoansAndLeases`, `cr‑assets:GoodwillAndIntangibles`  
- **Liabilities**: `cr‑liabilities:TotalLiabilities`, `cr‑liabilities:Deposits`, `cr‑liabilities:BorrowedMoney`  
- **Equity**: `cr‑equity:TotalEquityCapital`, `cr‑equity:RetainedEarnings`  
- **Income & Expenses**: `cr‑income:NetIncome`, `cr‑income:InterestIncome`, `cr‑expense:InterestExpense`, `cr‑expense:ProvisionForLoanLosses`  
- **Capital & Risk**: `cr‑capital:Tier1Capital`, `cr‑capital:RiskWeightedAssets`, `cr‑capital:Tier1LeverageRatio`  
- **General**: `cr‑general:Date`, `cr‑general:Percentage`, `cr‑general:Identifier`, `cr‑general:OtherMetric`

## ✅ Why This Approach  
- Enables browser‑based PDF text extraction (via PDF.js) so you can run in web apps without server overhead.  
- Uses chunking logic to keep input sizes safe for large‑language models and avoid context overflow.  
- Schema‑driven prompt approach ensures output is structured and machine‑readable (not just free text).  
- Deduplication ensures output is optimized and avoids redundant facts/data points.  
- Easily integrates with RAG workflows, vector stores, dashboards or other data pipelines.

## 🔮 Roadmap  
- Add CLI or backend service (Node.js) for batch processing of many PDFs.  
- Add advanced table extraction (detect and parse tabular data inside reports).  
- Publish full custom ontology documentation (JSON Schema, vocabulary).  
- Add additional exporters (CSV, Parquet) alongside JSON.  
- Add unit & integration tests covering: chunking logic, PDF extraction, schema validation, deduplication.  
- Possibly support file uploads + processing in serverless/cloud functions.

## 🤝 Contributing  
Contributions are welcome!  
1. Fork this repository  
2. Create a new branch for your feature or bug‑fix  
3. Add relevant tests where applicable  
4. Submit a pull request describing your changes, motivation and implications

## 📝 License  
MIT
