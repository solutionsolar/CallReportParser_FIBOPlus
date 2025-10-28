import React, { useState } from 'react';
import { FiboData, FiboItem, FinancialDataItem } from '../types';
import { convertToCsv } from '../utils/exportUtils';
import { FileIcon } from './icons/FileIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultDisplayProps {
  fileName: string;
  extractedText: string | null;
  fiboResult: FiboData | null;
  onReset: () => void;
}

const FiboItemCard: React.FC<{ item: FiboItem }> = ({ item }) => (
  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-cyan-600 transition-all duration-300">
    <h4 className="font-bold text-cyan-400">{item.name}</h4>
    <p className="text-sm text-slate-400 mt-1 font-mono break-all">{item.fibo_class}</p>
    <p className="text-slate-300 mt-3">{item.description}</p>
    <blockquote className="mt-3 pl-3 border-l-2 border-slate-600 text-sm text-slate-400 italic">
      "{item.context}"
    </blockquote>
  </div>
);

const FinancialDataCard: React.FC<{ item: FinancialDataItem }> = ({ item }) => (
  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-teal-600 transition-all duration-300 flex flex-col">
    <div className="flex justify-between items-start gap-2">
      <h4 className="font-bold text-teal-400">{item.name}</h4>
      <p className="text-2xl font-semibold text-slate-100 break-all">{item.value}</p>
    </div>
    <p className="text-sm text-slate-400 mt-1 font-mono break-all">{item.ontology_class}</p>
    <p className="text-slate-300 mt-3 flex-grow">{item.description}</p>
    <blockquote className="mt-3 pl-3 border-l-2 border-slate-600 text-sm text-slate-400 italic">
      "{item.context}"
    </blockquote>
  </div>
);

const FiboResultSection: React.FC<{ title: string; items: FiboItem[] }> = ({ title, items }) => {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-200 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <FiboItemCard key={`${title}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
};

const FinancialDataSection: React.FC<{ title: string; items: FinancialDataItem[] }> = ({ title, items }) => {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-200 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <FinancialDataCard key={`${title}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ fileName, extractedText, fiboResult, onReset }) => {
  const [showText, setShowText] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const cleanFileName = fileName.replace(/\.[^/.]+$/, "");

  const copyToClipboard = () => {
    if (fiboResult) {
      navigator.clipboard.writeText(JSON.stringify(fiboResult, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleExport = (format: 'json' | 'csv') => {
    if (!fiboResult) return;

    let fileContent: string;
    let fileType: string;
    let fileExtension: string;

    if (format === 'json') {
      fileContent = JSON.stringify(fiboResult, null, 2);
      fileType = 'application/json';
      fileExtension = 'json';
    } else {
      fileContent = convertToCsv(fiboResult);
      fileType = 'text/csv;charset=utf-8;';
      fileExtension = 'csv';
    }

    const blob = new Blob([fileContent], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanFileName}_fibo_export.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="p-6 bg-slate-800 rounded-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <FileIcon className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold text-slate-100 break-all">{fileName}</h2>
              </div>
              <p className="text-slate-400 mt-1">Analysis complete. Found {fiboResult?.financial_data.length || 0} data points, {fiboResult?.concepts.length || 0} concepts, {fiboResult?.entities.length || 0} entities, and {fiboResult?.relationships.length || 0} relationships.</p>
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap"
            >
              <RefreshIcon className="w-5 h-5" />
              Analyze New Document
            </button>
          </div>
          <div className="border-t border-slate-700/50 pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-slate-400 font-semibold my-auto whitespace-nowrap">Export Results:</span>
            <div className="flex items-center gap-3">
                 <button onClick={() => handleExport('json')} className="flex items-center gap-2 bg-cyan-800/50 hover:bg-cyan-700/50 text-cyan-200 font-semibold px-3 py-1.5 rounded-lg transition-colors duration-200">
                  <DownloadIcon className="w-5 h-5" />
                  JSON
                </button>
                <button onClick={() => handleExport('csv')} className="flex items-center gap-2 bg-cyan-800/50 hover:bg-cyan-700/50 text-cyan-200 font-semibold px-3 py-1.5 rounded-lg transition-colors duration-200">
                  <DownloadIcon className="w-5 h-5" />
                  CSV
                </button>
            </div>
          </div>
        </div>
      
      <div className="space-y-10">
        <FinancialDataSection title="Financial Data" items={fiboResult?.financial_data || []} />
        <FiboResultSection title="Entities" items={fiboResult?.entities || []} />
        <FiboResultSection title="Relationships" items={fiboResult?.relationships || []} />
        <FiboResultSection title="Concepts" items={fiboResult?.concepts || []} />
      </div>

      <div className="mt-8 border-t border-slate-700 pt-6">
        <div className="flex justify-between items-center">
             <button onClick={() => setShowText(!showText)} className="text-cyan-400 hover:text-cyan-300 font-semibold">
                {showText ? 'Hide' : 'Show'} Full Extracted Text
            </button>
            <button onClick={copyToClipboard} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold">
                <ClipboardIcon className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy JSON'}
            </button>
        </div>
       
        {showText && extractedText && (
          <div className="mt-4 bg-slate-950/50 p-4 rounded-lg max-h-96 overflow-y-auto border border-slate-700">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{extractedText}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
