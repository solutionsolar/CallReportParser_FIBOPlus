
import React from 'react';

export const NetworkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 1 0-18m0 18a8.999 8.999 0 0 0 3.86-7.53m-3.86 7.53a8.999 8.999 0 0 1-3.86-7.53M12 3v18m0-18a9 9 0 0 0-9 9m9-9a9 9 0 0 1 9 9" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="5" cy="10" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="19" cy="10" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="8" cy="17" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="16" cy="17" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
