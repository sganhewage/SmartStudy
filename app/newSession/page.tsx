'use client';

import { useState } from "react";
import { Paperclip, X, Upload, Trash2 } from "lucide-react"; // Optional icon lib

export default function NewStudySessionPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [instructions, setInstruction] = useState<string>("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setFiles([...files, ...Array.from(e.target.files)]);
    }
    };

    const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    };

    const clearFiles = () => setFiles([]);

    return (
        <div className="h-[calc(100vh-80px)] pt-[80px] px-6 sm:px-16 bg-gray-50 text-gray-900 flex flex-col">
            <div className="flex flex-row gap-x-5">
                <img src="/logo.png" alt="SmartStudy Logo" className="h-10 w-10" />
                <h1 className="text-4xl font-bold text-brand mb-2">Create a New Study Session</h1>
                <button className="ml-auto mr-5 bg-brand hover:bg-accent text-white text-xl font-semibold py-2 px-6 rounded-md transition">
                    Next
                </button>
            </div>
            <p className="text-lg text-gray-600 mb-8">Upload your files and provide any custom instructions (content to focus on, how to use uploaded files, etc.).</p>

            <div className="flex flex-col h-full lg:flex-row gap-4 w-full overflow-hidden mb-4">
                {/* File Upload Box */}
                <div className="flex flex-col w-full lg:w-1/3 flex-1 overflow-y-auto border-2 border-dashed border-brand rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Files ({files.length})</h2>
                    <div className="flex gap-2">
                        <label htmlFor="file-upload" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-brand text-brand hover:bg-brand hover:text-white cursor-pointer transition">
                            <Upload size={16} /> Add files
                            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                        </label>
                        <button
                            onClick={clearFiles}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                        >
                            <Trash2 size={16} /> Remove all
                        </button>
                    </div>
                    </div>

                    <ul className="space-y-3">
                    {files.map((file, index) => (
                        <li
                        key={index}
                        className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
                        >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Paperclip className="text-brand" size={18} />
                            <div className="truncate">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => removeFile(index)}
                            className="text-gray-500 hover:text-red-600 transition"
                        >
                            <X size={18} />
                        </button>
                        </li>
                    ))}
                    </ul>
                </div>
            
                {/* Extra Instructions */}
                <div className="w-full lg:w-2/3 h-full">
                    <textarea
                        placeholder="Enter any extra instructions..."
                        rows={5}
                        className="w-full h-full p-4 rounded-md border border-gray-300 focus:outline-brand focus:ring-1 focus:ring-accent text-lg resize-none"
                        onChange={(e) => setInstruction(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
