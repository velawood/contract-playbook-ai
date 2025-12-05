
import React, { useCallback } from 'react';
import { UploadCloud, FileType } from 'lucide-react';

interface FileUploadProps {
    onFileSelected: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected }) => {
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelected(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
        }
    };

    return (
        <div 
            className="w-full max-w-lg mx-auto p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer text-center group"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-input')?.click()}
        >
            <input 
                type="file" 
                id="file-upload-input" 
                className="hidden" 
                accept=".docx,.pdf,.json"
                onChange={handleFileChange}
            />
            <div className="mb-4 flex justify-center">
                <div className="bg-white p-4 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-blue-600" />
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Upload Contract or Playbook</h3>
            <p className="text-sm text-gray-500 mb-4">Drag & drop your .DOCX, .PDF or .JSON here</p>
            <span className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 shadow-sm group-hover:border-blue-300">
                Browse Files
            </span>
        </div>
    );
};

export default FileUpload;
