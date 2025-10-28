import { GoogleGenAI, Type } from "@google/genai";
import { FiboData, FiboItem, FinancialDataItem } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const CHUNK_SIZE = 15000; // Characters, a safe limit for context window

const fiboItemSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The name of the identified item (e.g., "Acme Corp", "Loan Agreement").' },
    fibo_class: { type: Type.STRING, description: 'The corresponding FIBO class (e.g., fibo-fbc-fi-fi:FinancialInstitution, fibo-fbc-pas-fpas:FinancialProductAsAService).' },
    description: { type: Type.STRING, description: 'A brief explanation of the item in the context of the document.' },
    context: { type: Type.STRING, description: 'The exact text snippet from the document where the item was found.' },
  },
  required: ['name', 'fibo_class', 'description', 'context'],
};

const financialDataItemSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The label or name of the data point (e.g., "Total Assets", "Interest Rate").' },
    value: { type: Type.STRING, description: 'The extracted value of the data point (e.g., "$1,500,000", "3.5%").' },
    ontology_class: { type: Type.STRING, description: 'The corresponding class from the custom Call Report Ontology (e.g., cr-assets:TotalAssets).' },
    description: { type: Type.STRING, description: 'A brief explanation of what this data point represents.' },
    context: { type: Type.STRING, description: 'The exact text snippet from the document where the data was found.' },
  },
  required: ['name', 'value', 'ontology_class', 'description', 'context'],
};

const fiboSchema = {
  type: Type.OBJECT,
  properties: {
    concepts: {
      type: Type.ARRAY,
      description: 'Abstract ideas or notions relevant to FIBO (e.g., "Risk", "Interest Rate").',
      items: fiboItemSchema,
    },
    entities: {
      type: Type.ARRAY,
      description: 'Specific instances like companies, people, accounts, or financial instruments mentioned in the text.',
      items: fiboItemSchema,
    },
    relationships: {
      type: Type.ARRAY,
      description: 'Connections or associations between entities and/or concepts (e.g., "Acme Corp is a lender to Beta Inc.").',
      items: fiboItemSchema,
    },
    financial_data: {
      type: Type.ARRAY,
      description: 'Specific financial data points, such as monetary values, percentages, and dates, mapped to the custom Call Report Ontology.',
      items: financialDataItemSchema,
    },
  },
};

const chunkText = (text: string, chunkSize: number): string[] => {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // If a single paragraph is too long, we must split it.
    if (paragraph.length > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      let subParaPos = 0;
      while (subParaPos < paragraph.length) {
        chunks.push(paragraph.substring(subParaPos, subParaPos + chunkSize));
        subParaPos += chunkSize;
      }
    } else if (currentChunk.length + paragraph.length + 2 > chunkSize) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }
  return chunks;
};


export const applyFiboOntology = async (
  text: string,
  onProgress: (message: string) => void
): Promise<FiboData> => {
  const chunks = chunkText(text, CHUNK_SIZE);
  const totalChunks = chunks.length;

  if (totalChunks === 0) {
    return { concepts: [], entities: [], relationships: [], financial_data: [] };
  }

  const aggregatedResult: FiboData = { concepts: [], entities: [], relationships: [], financial_data: [] };

  for (let i = 0; i < totalChunks; i++) {
    const chunk = chunks[i];
    onProgress(`Applying FIBO ontology... (Processing chunk ${i + 1} of ${totalChunks})`);

    const prompt = `
      You are an expert financial analyst specializing in ontologies. Analyze the following text from a financial document, such as a Call Report. Perform two main tasks:

      1.  **FIBO Analysis**: Identify concepts, entities, and relationships corresponding to the Financial Industry Business Ontology (FIBO). For each, provide its name, the most relevant FIBO class, a description of its role, and the context snippet.

      2.  **Financial Data Extraction and Mapping**: Extract all specific financial data points (monetary values, percentages, dates, ratios, etc.). For each data point, you MUST map it to the most appropriate class from the **Custom Call Report Ontology** provided below. Provide its name/label, its value, its assigned ontology class, a brief description, and the context snippet.

      **Custom Call Report Ontology (Prefix: cr-)**
      You MUST use these classes for financial data points.
      - Assets
        - \`cr-assets:TotalAssets\`: The total value of all assets.
        - \`cr-assets:CashAndBalancesDue\`: Cash on hand and balances due from depository institutions.
        - \`cr-assets:Securities\`: Holdings of various securities.
        - \`cr-assets:LoansAndLeases\`: Total value of all loans and leases.
        - \`cr-assets:GoodwillAndIntangibles\`: Value of intangible assets.
      - Liabilities
        - \`cr-liabilities:TotalLiabilities\`: Total obligations owed to creditors.
        - \`cr-liabilities:Deposits\`: Total amount of all deposits.
        - \`cr-liabilities:BorrowedMoney\`: Funds borrowed from other sources.
      - Equity
        - \`cr-equity:TotalEquityCapital\`: Total value of ownership interest.
        - \`cr-equity:RetainedEarnings\`: Portion of net income not paid out as dividends.
      - Income & Expenses
        - \`cr-income:NetIncome\`: Profit after all expenses and taxes.
        - \`cr-income:InterestIncome\`: Income from interest-earning assets.
        - \`cr-expense:InterestExpense\`: Expense on interest-bearing liabilities.
        - \`cr-expense:ProvisionForLoanLosses\`: Expense set aside for potential bad loans.
      - Capital & Risk
        - \`cr-capital:Tier1Capital\`: Core measure of a bank's financial strength.
        - \`cr-capital:RiskWeightedAssets\`: Assets weighted according to risk.
        - \`cr-capital:Tier1LeverageRatio\`: A measure of a bank's core capital to its total assets.
      - General
        - \`cr-general:Date\`: A specific date (e.g., reporting date, maturity date).
        - \`cr-general:Percentage\`: A value expressed as a percentage (e.g., interest rate, ratio).
        - \`cr-general:Identifier\`: A specific identifier (e.g., CUSIP, Ticker).
        - \`cr-general:OtherMetric\`: A financial metric not fitting other categories.

      If no items are found for a category, return an empty array for it. Structure your response strictly according to the provided JSON schema.

      Text to analyze:
      ---
      ${chunk}
      ---
      `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: fiboSchema,
          temperature: 0.1,
        },
      });
      
      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString) as FiboData;

      aggregatedResult.concepts.push(...(result.concepts || []));
      aggregatedResult.entities.push(...(result.entities || []));
      aggregatedResult.relationships.push(...(result.relationships || []));
      aggregatedResult.financial_data.push(...(result.financial_data || []));
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
      throw new Error(`Failed to process chunk ${i + 1}/${totalChunks}. The AI model returned an error or an invalid response.`);
    }
  }

  // Deduplicate results
  const deduplicateFiboItems = (items: FiboItem[]): FiboItem[] => {
    const map = new Map<string, FiboItem>();
    items.forEach(item => {
      const key = `${item.name.toLowerCase().trim()}|${item.fibo_class.toLowerCase().trim()}|${item.context.toLowerCase().trim()}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  };

  const deduplicateFinancialDataItems = (items: FinancialDataItem[]): FinancialDataItem[] => {
    const map = new Map<string, FinancialDataItem>();
    items.forEach(item => {
      const key = `${item.name.toLowerCase().trim()}|${item.value.toLowerCase().trim()}|${item.ontology_class.toLowerCase().trim()}|${item.context.toLowerCase().trim()}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  };

  return {
    concepts: deduplicateFiboItems(aggregatedResult.concepts),
    entities: deduplicateFiboItems(aggregatedResult.entities),
    relationships: deduplicateFiboItems(aggregatedResult.relationships),
    financial_data: deduplicateFinancialDataItems(aggregatedResult.financial_data),
  };
};
