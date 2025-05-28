    'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

    type SessionContextType = {
    files: File[];
    setFiles: (files: File[]) => void;
    instructions: string;
    setInstructions: (instructions: string) => void;
    sessionName: string;
    setSessionName: (name: string) => void;
    sessionDescription: string;
    setSessionDescription: (desc: string) => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSessionContext() {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSessionContext must be used within a SessionProvider');
    return context;
}

export function SessionProvider({ children }: { children: ReactNode }) {
    const [files, setFiles] = useState<File[]>([]);
    const [instructions, setInstructions] = useState('');
    const [sessionName, setSessionName] = useState('');
    const [sessionDescription, setSessionDescription] = useState('');

    return (
        <SessionContext.Provider value={{
            files, setFiles,
            instructions, setInstructions,
            sessionName, setSessionName,
            sessionDescription, setSessionDescription
            }}>
                {children}
        </SessionContext.Provider>
    );
}