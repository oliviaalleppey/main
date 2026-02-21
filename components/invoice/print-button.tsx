
'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function PrintButton() {
    return (
        <div className="fixed bottom-8 right-8 print:hidden">
            <Button
                onClick={() => window.print()}
                className="bg-[#0A4D4E] text-white px-6 py-3 rounded shadow-lg font-bold hover:bg-[#083D3E] flex items-center gap-2"
            >
                <Printer className="w-5 h-5" />
                PRINT INVOICE
            </Button>
        </div>
    );
}
