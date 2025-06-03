'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SessionPage() {
    const params = useParams();
    const id = params?.id;

    const [session, setSession] = useState<any>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
        try {
            const res = await axios.get('/api/getSessions');
            const found = res.data.find((s: any) => s._id === id);
            if (found) {
            setSession(found);
            setName(found.name);
            setDescription(found.description);
            } else {
            console.error('Session not found');
            }
        } catch (err) {
            console.error('Error fetching session:', err);
        }
        };

        fetchSession();
    }, [id]);

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editInstructions, setEditInstructions] = useState('');

    useEffect(() => {
        if (session) {
            setEditName(session.name);
            setEditDescription(session.description);
            setEditInstructions(session.instructions);
        }
    }, [session]);



    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put('/api/updateSession', {
                sessionId: session._id,
                name: editName,
                description: editDescription,
                instructions: editInstructions,
            });
            alert('Changes saved!');
            setIsEditing(false);
            location.reload(); // or trigger re-fetch
        } catch (error) {
            console.error('Failed to update session:', error);
            alert('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (!session) return <p className="p-6">Loading session...</p>;

    return (
        <>
            <div className="min-h-[calc(100vh-95px)] bg-gray-50 pt-[95px]">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 relative">
                        <h1 className="text-4xl font-bold text-brand mb-2">{session.name}</h1>
                        <p className="text-gray-600 text-lg">{session.description}</p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-6 right-6 bg-accent text-white px-4 py-2 rounded hover:bg-gray-600 transition z-10"
                            >
                            Edit
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Sidebar */}
                        <div className="bg-white p-6 rounded-lg shadow col-span-1">
                            <h2 className="text-xl font-semibold mb-4">Session Info</h2>

                            <div className="mb-4">
                            <p className="text-sm text-gray-500">Created:</p>
                            <p className="text-md">{new Date(session.createdAt).toLocaleString()}</p>
                            </div>

                            <div className="mb-4">
                            <p className="text-sm text-gray-500">Instructions:</p>
                            <p className="text-md whitespace-pre-line">{session.instructions || 'N/A'}</p>
                            </div>

                            <div className="mb-4">
                            <p className="text-sm text-gray-500">Files Uploaded:</p>
                            <p className="text-md font-semibold">{session.files?.length || 0}</p>
                            </div>

                            <div>
                            <p className="text-sm text-gray-500">Generated Study Tools:</p>
                            <ul className="list-disc ml-5 mt-2">
                                {session.generationList?.map((tool: string, i: number) => (
                                <li key={i} className="text-sm capitalize">{tool.replace(/([A-Z])/g, ' $1')}</li>
                                )) || <li>None</li>}
                            </ul>
                            </div>
                        </div>

                        {/* Right: File previews */}
                        <div className="col-span-2">
                            <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {session.files.map((file: any) => {
                                    const isImage = file.fileType?.startsWith("image/");
                                    const isPDF = file.fileType === "application/pdf";

                                    return (
                                    <div
                                        key={file.gridFsId}
                                        className="border rounded-lg p-4 flex flex-col items-center text-center shadow"
                                    >
                                        <h4 className="font-semibold mb-2 truncate w-full">{file.fileName}</h4>

                                        {isImage ? (
                                        <img
                                            src={`/api/file/${file.gridFsId}`}
                                            alt={file.fileName}
                                            className="w-full max-h-60 object-contain rounded"
                                        />
                                        ) : isPDF ? (
                                        <iframe
                                            src={`/api/file/${file.gridFsId}`}
                                            title={file.fileName}
                                            className="w-full h-60 border rounded"
                                        ></iframe>
                                        ) : (
                                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-500 italic border rounded">
                                            Preview not available
                                        </div>
                                        )}

                                        <p className="text-sm text-gray-500 mt-2">{file.fileType}</p>

                                        <a
                                        href={`/api/file/${file.gridFsId}`}
                                        download={file.fileName}
                                        className="mt-2 text-blue-600 underline"
                                        >
                                        Download
                                        </a>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-semibold mb-4">Edit Session</h2>

                        <label className="block font-medium mb-1">Name</label>
                        <input
                        className="w-full border p-2 rounded mb-4"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        />

                        <label className="block font-medium mb-1">Description</label>
                        <textarea
                        className="w-full border p-2 rounded mb-4"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        />

                        <label className="block font-medium mb-1">Instructions</label>
                        <textarea
                        className="w-full border p-2 rounded mb-4"
                        value={editInstructions}
                        onChange={(e) => setEditInstructions(e.target.value)}
                        />

                        <label className="block font-medium mb-2">Uploaded Files</label>
                        <ul className="list-disc ml-5 mb-4 space-y-2">
                        {session.files.map((file: any, index: number) => (
                            <li key={file.gridFsId} className="flex items-center justify-between">
                            <span className="truncate">{file.fileName}</span>
                            <button
                                className="text-red-500 text-sm ml-2 hover:underline"
                                onClick={() => {
                                const updatedFiles = session.files.filter((_, i) => i !== index);
                                setSession({ ...session, files: updatedFiles });
                                }}
                            >
                                Remove
                            </button>
                            </li>
                        ))}
                        </ul>

                        <label className="block font-medium mb-1">Add More Files</label>
                        <input
                        type="file"
                        multiple
                        onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            setSession({ ...session, newUploads: newFiles });
                        }}
                        className="w-full border p-2 rounded mb-4"
                        />

                        <div className="flex justify-end gap-4">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded border border-gray-400 text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-brand text-white px-4 py-2 rounded hover:bg-accent transition"
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
