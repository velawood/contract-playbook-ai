
import React, { useMemo } from 'react';
import { calculateWordDiff, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from '../utils/diff';

interface DiffViewerProps {
    original: string;
    proposed: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ original = "", proposed = "" }) => {
  
  const diffs = useMemo(() => calculateWordDiff(original, proposed), [original, proposed]);

  return (
    <div className="font-serif leading-relaxed text-sm p-3 bg-gray-50/50 rounded border border-gray-100">
       {diffs.map((part, index) => {
           if (part.op === DIFF_DELETE) {
               return (
                   <span key={index} className="bg-red-100 text-red-800 line-through decoration-red-400 decoration-2 mx-0.5 px-0.5 rounded-sm">
                       {part.text}
                   </span>
               );
           } else if (part.op === DIFF_INSERT) {
               return (
                   <span key={index} className="bg-green-100 text-green-800 border-b-2 border-green-400 mx-0.5 px-0.5 rounded-sm">
                       {part.text}
                   </span>
               );
           }
           return <span key={index}>{part.text}</span>;
       })}
    </div>
  );
};

export default DiffViewer;
