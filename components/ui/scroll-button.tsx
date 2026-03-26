'use client';

import { ChevronDown } from 'lucide-react';

interface ScrollButtonProps {
    targetId: string;
}

export default function ScrollButton({ targetId }: ScrollButtonProps) {
    return (
        <button 
            type="button"
            className="mt-12 group inline-flex items-center justify-center w-16 h-16 rounded-full border border-white/30 hover:border-white transition-all bg-white/5 hover:bg-white/10 backdrop-blur-sm animate-bounce cursor-pointer" 
            onClick={(e) => {
                e.preventDefault();
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-label="Scroll down"
        >
            <ChevronDown className="w-6 h-6 text-white group-hover:translate-y-1 transition-transform" />
        </button>
    );
}
