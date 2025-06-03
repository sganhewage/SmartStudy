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

    const handleSave = async () => {
        setIsSaving(true);
        try {
        await axios.put('/api/updateSession', {
            sessionId: id,
            name,
            description
        });
        alert('Changes saved!');
        } catch (error) {
        console.error('Failed to update session:', error);
        alert('Failed to save changes');
        } finally {
        setIsSaving(false);
        }
    };

    if (!session) return <p className="p-6">Loading session...</p>;

    return (
        <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Session: {session.name}</h1>

        <div className="mb-4">
            <label className="block font-medium mb-1">Session Name</label>
            <input
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            />
        </div>

        <div className="mb-4">
            <label className="block font-medium mb-1">Description</label>
            <textarea
            className="w-full border p-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            />
        </div>

        <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand text-white px-4 py-2 rounded hover:bg-accent transition"
        >
            {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        <div className="mt-10">
            <h2 className="text-xl font-semibold mb-2">Uploaded Files</h2>
            <ul className="list-disc ml-5">
            {session.files.map((file: any) => (
                <li key={file.gridFsId}>
                {file.fileName} ({file.fileType})
                </li>
            ))}
            </ul>
        </div>

        <p className="text-sm text-gray-500 mt-6">
            Created: {new Date(session.createdAt).toLocaleString()}
        </p>
        </div>
    );
}
