
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if(e.dataTransfer.files[0].type === "application/pdf") {
        onFileSelect(e.dataTransfer.files[0]);
      } else {
        alert("Please upload a valid PDF file.");
      }
    }
  }, [onFileSelect]);


  return (
    <div className="w-full max-w-xl mx-auto">
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center w-full h-64 px-4 transition bg-slate-800 border-2 ${isDragging ? 'border-cyan-400' : 'border-slate-700'} border-dashed rounded-xl appearance-none cursor-pointer hover:border-slate-500 focus:outline-none`}
      >
        <span className="flex flex-col items-center justify-center space-y-4">
          <UploadIcon className={`w-16 h-16 ${isDragging ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span className="font-medium text-slate-300">
            Drop your PDF here, or{' '}
            <span className="text-cyan-400 underline">click to browse</span>
          </span>
           <span className="text-xs text-slate-500">
            PDF documents only
          </span>
        </span>
        <input
          type="file"
          name="file_upload"
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};
