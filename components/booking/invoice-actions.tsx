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
            className="bg-[#0A332B] text-white px-6 py-2 text-sm font-bold rounded shadow-sm hover:bg-[#15443B]"
        >
            Print Document
        </button>
    );
}
