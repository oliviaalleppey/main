'use client';

import { useEffect } from 'react';

export function AutoPrint() {
    useEffect(() => {
        // Small delay ensures images and fonts are fully loaded before capturing
        const timer = setTimeout(() => {
            window.print();
        }, 800);
        return () => clearTimeout(timer);
    }, []);
    
    return null;
}

export function PrintButton() {
    return (
        <button 
            onClick={() => window.print()}
            className="bg-[var(--brand-primary)] text-white px-6 py-2 text-sm font-bold rounded shadow-sm hover:bg-[var(--brand-primary-dark)]"
        >
            Print Document
        </button>
    );
}
