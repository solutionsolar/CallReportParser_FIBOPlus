
// This assumes pdfjsLib is available on the window object, as loaded in index.html
declare const window: {
    pdfjsLib: any;
};

export const extractTextFromPdf = async (file: File): Promise<string> => {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js library is not loaded.');
  }

  const fileReader = new FileReader();
  
  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          return reject(new Error('Failed to read file.'));
        }
        
        const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
        const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        resolve(fullText);
      } catch (error) {
        reject(new Error('Error parsing PDF file: ' + (error as Error).message));
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Error reading the file.'));
    };

    fileReader.readAsArrayBuffer(file);
  });
};
