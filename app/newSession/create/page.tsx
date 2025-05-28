'use client';

import { useSessionContext } from '@/app/newSession/SessionContext';

export default function CreatePage() {
    const {
        files,
        instructions,
        sessionName,
        sessionDescription
    } = useSessionContext();

    const handleSubmit = async () => {
        const formData = new FormData();
        files.forEach((file, index) => {
        formData.append(`file${index}`, file);
        });
        formData.append("instructions", instructions);
        formData.append("sessionName", sessionName);
        formData.append("sessionDescription", sessionDescription);

        const res = await fetch('/api/saveSession', {
        method: 'POST',
        body: formData,
        });

        if (res.ok) {
        console.log("Session saved!");
        } else {
        console.error("Error saving session");
        }
    };

    return (
        <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Review and Confirm</h1>
        <p><strong>Name:</strong> {sessionName}</p>
        <p><strong>Description:</strong> {sessionDescription}</p>
        <p><strong>Instructions:</strong> {instructions}</p>
        <p><strong>Files:</strong> {files.map(f => f.name).join(", ")}</p>

        <button onClick={handleSubmit} className="mt-4 bg-brand text-white px-4 py-2 rounded">Submit</button>
        </div>
    );
}