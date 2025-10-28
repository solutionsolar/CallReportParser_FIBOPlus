
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { extractTextFromPdf } from './services/pdfService';
import { applyFiboOntology } from './services/geminiService';
import { FiboData } from './types';

export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [fiboResult, setFiboResult] = useState<FiboData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setPdfFile(null);
    setExtractedText(null);
    setFiboResult(null);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
  };

  const handleFileSelect = useCallback(async (file: File) => {
    resetState();
    setPdfFile(file);
    setIsLoading(true);
    setError(null);

    try {
      setLoadingMessage('Extracting text from PDF...');
      const text = await extractTextFromPdf(file);
      setExtractedText(text);

      if (text.trim().length === 0) {
        throw new Error("No text could be extracted from the PDF. The document might be image-based or empty.");
      }

      setLoadingMessage('Applying FIBO ontology with Gemini...');
      const result = await applyFiboOntology(text, setLoadingMessage);
      setFiboResult(result);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8">
          {isLoading ? (
            <Loader message={loadingMessage} />
          ) : (
            <>
              {error && (
                 <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6" role="alert">
                  <strong className="font-bold">Error:</strong>
                  <span className="block sm:inline ml-2">{error}</span>
                </div>
              )}
              {!fiboResult ? (
                <FileUpload onFileSelect={handleFileSelect} />
              ) : (
                <ResultDisplay
                  fileName={pdfFile?.name || 'document'}
                  extractedText={extractedText}
                  fiboResult={fiboResult}
                  onReset={resetState}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
