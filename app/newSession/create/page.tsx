'use client';

import { useState } from "react";
import { useEffect } from "react";
import { useSessionContext } from '../SessionContext';
import { X } from 'lucide-react';
import axios from "axios";
import { set } from "mongoose";

const studyOptions = [
  { label: 'Study Guide', value: 'studyGuide', icon: '📘', description: 'Summarizes topics and key points' },
  { label: 'Practice Tests', value: 'practiceTests', icon: '📝', description: 'Timed, exam-style questions' },
  { label: 'Practice Problems', value: 'practiceProblems', icon: '➗', description: 'Drill specific skills or concepts' },
  { label: 'Flashcards', value: 'flashcards', icon: '📇', description: 'Review key terms and concepts' },
  { label: 'Lecture Summary', value: 'lectureSummary', icon: '📄', description: 'Condensed overview of your files' },
  { label: 'Key Terms', value: 'keyTerms', icon: '🧠', description: 'Identifies and defines key vocabulary' }
];

export default function StudyContentSelection() {
    const { sessionName, sessionDescription, instructions, files } = useSessionContext();
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [generationList, setGenerationList] = useState<string[]>([]);
    const [configMap, setConfigMap] = useState<Record<string, any>>({});

    const toggleQuestionType = (type: string) => {
        setConfigMap(prev => ({
        ...prev,
        [selectedOption!]: {
            ...prev[selectedOption!],
            questionTypes: {
            ...prev[selectedOption!]?.questionTypes,
            [type]: !prev[selectedOption!]?.questionTypes?.[type]
            }
        }
        }));
    };

    const addToList = (value: string) => {
        if (!generationList.includes(value)) {
        setGenerationList([...generationList, value]);
        }
    };

    const removeFromList = (value: string) => {
        setGenerationList(generationList.filter(item => item !== value));
    };

    const [isLoading, setIsLoading] = useState(false);
    const handleGenerate = async () => {
        if (generationList.length === 0) {
        alert("Please select at least one item to generate.");
        return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('sessionName', sessionName);
            formData.append('sessionDescription', sessionDescription);
            formData.append('instructions', instructions);
            formData.set('configMap', JSON.stringify(configMap));

            generationList.forEach((item) => {
                formData.append('generationList', item);
            });

            files.forEach((file, index) => {
                formData.append('files', file); // browser will handle the correct MIME
            });

            // console.log("=== FormData Debug ===");
            // for (let [key, value] of formData.entries()) {
            //     console.log(`${key}:`, value);
            //     if (value instanceof File) {
            //         console.log(`  File details - Name: ${value.name}, Size: ${value.size}, Type: ${value.type}`);
            //     }
            // }
            // console.log("Files array length:", files.length);
            // console.log("Files array:", files);

            const res = await axios.post('/api/generateStudyContent', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.status === 200) {
                alert("Content Uploaded! Study Generation in Progress.");
                
                // Optionally, redirect or clear state
                //setGenerationList([]);
                //setConfigMap({});
            } else {
                alert("Failed to generate content. Please try again.");
            }
        } catch (error) {
            console.error("Error generating content:", error);
            alert("An error occurred while generating content. Please try again.");
        }

        setIsLoading(false);
    };

  const renderQuestionTypeToggles = () => {
    const types = configMap[selectedOption!]?.questionTypes || {};
    return (
      <div className="mb-4">
        <label className="block mb-1 font-medium">Question Types</label>
        <div className="flex gap-4">
          {['multipleChoice', 'trueFalse', 'fillBlank'].map(type => (
            <label key={type} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={types[type] || false}
                onChange={() => toggleQuestionType(type)}
              />
              <span className="capitalize">{type.replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
        <div className="min-h-[calc(100vh-95px)] pt-[95px] px-6 sm:px-16 bg-gray-50 text-gray-900 flex relative z-0">
            {/* Left Pane */}
            <div className="w-full lg:w-1/3 border-r border-gray-300 pr-6">
                <h2 className="text-2xl font-bold text-brand mb-6">Select Content Type</h2>
                <ul className="space-y-4">
                {studyOptions.map(option => (
                    <li
                    key={option.value}
                    onClick={() => setSelectedOption(option.value)}
                    className={`cursor-pointer p-4 rounded-md border transition ${
                        selectedOption === option.value
                        ? 'bg-brand text-white border-brand shadow'
                        : 'bg-white hover:bg-gray-100 border-gray-300'
                    }`}
                    >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                        <p className="font-semibold">{option.label}</p>
                        <p className={`text-sm ${
                                selectedOption === option.value ? 'text-white' : 'text-gray-500'}`}
                            >
                            {option.description}
                        </p>

                        </div>
                    </div>
                    </li>
                ))}
                </ul>
            </div>

            {/* Right Pane */}
            <div className="w-full lg:w-2/3 pl-6 relative flex flex-col">
                <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Configuration</h2>
                <button
                    onClick={handleGenerate}
                    disabled={!selectedOption}
                    className="bg-brand hover:bg-accent text-white px-6 py-2 rounded-md text-lg font-semibold transition"
                >
                    Generate
                </button>
                </div>

                {selectedOption ? (
                <div className="flex-1">
                    <p className="text-md mb-4 text-gray-600">
                    Configure and add <strong>{studyOptions.find(o => o.value === selectedOption)?.label}</strong> to your generation list.
                    </p>

                    {/* Specific Configs */}
                    {selectedOption === 'practiceTests' && (
                    <>
                        <div className="mb-4">
                        <label className="block mb-1 font-medium">Test Duration (minutes)</label>
                        <input
                            type="range"
                            min="10"
                            max="120"
                            step="10"
                            value={configMap[selectedOption]?.testDuration || 30}
                            onChange={(e) => setConfigMap(prev => ({
                            ...prev,
                            [selectedOption]: {
                                ...prev[selectedOption],
                                testDuration: Number(e.target.value)
                            }
                            }))}
                            className="w-full"
                        />
                        <p>{configMap[selectedOption]?.testDuration || 30} minutes</p>
                        </div>
                        {renderQuestionTypeToggles()}
                    </>
                    )}

                    {selectedOption === 'practiceProblems' && (
                    <>
                        <div className="mb-4">
                        <label className="block mb-1 font-medium">Number of Practice Problems</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={configMap[selectedOption]?.practiceCount || 10}
                            onChange={(e) => setConfigMap(prev => ({
                            ...prev,
                            [selectedOption]: {
                                ...prev[selectedOption],
                                practiceCount: Number(e.target.value)
                            }
                            }))}
                            className="border border-gray-300 p-2 rounded-md w-32"
                        />
                        </div>
                        {renderQuestionTypeToggles()}
                    </>
                    )}

                    {selectedOption === 'flashcards' && (
                        <div className="mb-4">
                            <label className="block mb-1 font-medium">Flashcard Mode</label>
                            <select
                                className="border border-gray-300 p-2 rounded-md w-full"
                                value={configMap[selectedOption]?.flashcardMode || 'termFirst'}
                                onChange={(e) => setConfigMap(prev => ({
                                    ...prev,
                                    [selectedOption!]: {
                                        ...prev[selectedOption!],
                                        flashcardMode: e.target.value
                                    }
                                }))}
                            >
                                <option value="termFirst">Start with Term</option>
                                <option value="definitionFirst">Start with Definition</option>
                                <option value="both">Both</option>
                            </select>
                        </div>
                    )}


                    {/* Shared Special Instructions */}
                    <div className="mb-4">
                    <label className="block font-medium mb-1">Special Instructions</label>
                    <textarea
                        placeholder="Any specific guidance for this item..."
                        value={configMap[selectedOption]?.instructions || ''}
                        onChange={(e) => setConfigMap(prev => ({
                        ...prev,
                        [selectedOption!]: {
                            ...prev[selectedOption!],
                            instructions: e.target.value
                        }
                        }))}
                        className="w-full p-2 border border-gray-300 rounded-md hover:border-accent transition"
                    />
                    </div>

                    <button
                    onClick={() => addToList(selectedOption)}
                    className="mt-2 bg-brand hover:bg-accent text-white px-6 py-2 rounded-md text-lg transition"
                    >
                    Add to Generation List
                    </button>
                </div>
                ) : (
                <div className="text-gray-400 text-lg italic mt-16 text-center flex-1">
                    Select a content type to configure...
                </div>
                )}

                {/* Generation List Icons */}
                <div className="absolute bottom-4 left-4 flex gap-4">
                {generationList.map(value => {
                    const opt = studyOptions.find(o => o.value === value);
                    return (
                    <div
                        key={value}
                        className="relative group cursor-pointer text-4xl"
                        onClick={() => removeFromList(value)}
                    >
                        <span>{opt?.icon}</span>
                        <div className="absolute -top-3 -right-3 hidden group-hover:block">
                        <X size={16} className="bg-red-500 text-white rounded-full p-0.5" />
                        </div>
                    </div>
                    );
                })}
                </div>
            </div>
        </div>

        {isLoading && (
            <div className="fixed inset-0 z-[9999] bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <div className="text-xl font-semibold text-gray-800 animate-pulse">
                    Uploading content...
                </div>
            </div>
        )}
    </>
  );
}
