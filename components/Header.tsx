
import React from 'react';
import { NetworkIcon } from './icons/NetworkIcon';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="inline-flex items-center justify-center bg-slate-800 p-4 rounded-full mb-4">
        <NetworkIcon className="w-10 h-10 text-cyan-400" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">
        Call Report Parser - FIBO+ Ontology
      </h1>
      <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
        Upload a financial document to automatically identify and classify key information using the FIBO standard.
      </p>
    </header>
  );
};
