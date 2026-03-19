'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronRight, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AddOnsSelector } from './add-ons-selector';

interface CheckoutStepperProps {
    searchStep: React.ReactNode;
    inlineSearchEditor?: React.ReactNode;
    roomStep: React.ReactNode;
    roomListContent?: React.ReactNode;
    availableAddOns: any[];
    selectedAddOns: any[];
    guestInfoContent: React.ReactNode;
    paymentContent: React.ReactNode;
    orderSummary: React.ReactNode;
    hasGuestDetails: boolean;
    initialStep?: number;
    selectedRatePlanId?: string;
    searchHash?: string;
}

export function CheckoutStepper({
    searchStep,
    roomStep,
    availableAddOns,
    selectedAddOns,
    guestInfoContent,
    paymentContent,
    orderSummary,
    hasGuestDetails,
    inlineSearchEditor,
    roomListContent,
    initialStep,
    selectedRatePlanId,
    searchHash,
}: CheckoutStepperProps) {
    // 1: Search, 2: Room, 3: Enhance Stay, 4: Guest Info, 5: Payment
    const defaultStep = initialStep ?? (hasGuestDetails ? 5 : 3);
    const initialCompleted = [];
    if (defaultStep > 1) initialCompleted.push(1);
    if (defaultStep > 2) initialCompleted.push(2);
    if (defaultStep > 3) initialCompleted.push(3);
    if (defaultStep > 4) initialCompleted.push(4);

    const [activeStep, setActiveStep] = useState<number>(defaultStep);
    const [completedSteps, setCompletedSteps] = useState<number[]>(initialCompleted);

    // Auto-advance to step 3 when a room is selected
    const prevRatePlanId = useRef(selectedRatePlanId);
    useEffect(() => {
        if (selectedRatePlanId && selectedRatePlanId !== prevRatePlanId.current) {
            setCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
            if (activeStep === 2) {
                setActiveStep(3);
            }
        }
        prevRatePlanId.current = selectedRatePlanId;
    }, [selectedRatePlanId, activeStep]);

    // Listen for manual "Select" clicks on the exact same rate plan
    useEffect(() => {
        const handleRoomSelected = () => {
            setCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
            setActiveStep((prev) => (prev === 2 ? 3 : prev));
        };
        window.addEventListener('room-selected', handleRoomSelected);
        return () => window.removeEventListener('room-selected', handleRoomSelected);
    }, []);

    // Force return to step 2 if search params change
    const prevSearchHash = useRef(searchHash);
    useEffect(() => {
        if (searchHash && prevSearchHash.current && searchHash !== prevSearchHash.current) {
            setActiveStep(2);
            setCompletedSteps([1]);
        }
        prevSearchHash.current = searchHash;
    }, [searchHash]);

    const handleNext = (nextStep: number) => {
        setCompletedSteps((prev) => Array.from(new Set([...prev, activeStep])));
        setActiveStep(nextStep);
    };

    // Auto-scroll to active step
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const timer = setTimeout(() => {
            const el = document.getElementById(`step-${activeStep}`);
            if (el) {
                const yOffset = typeof window !== 'undefined' && window.innerWidth < 1024 ? -80 : -20; // account for sticky mobile header
                const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }, 350); // wait for framer-motion exit animation to clear the DOM space
        return () => clearTimeout(timer);
    }, [activeStep]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start max-w-[1400px] mx-auto w-full">
            {/* Main Content Area */}
            <div className="flex-1 w-full space-y-4">
                {/* Step 1: Search */}
                <div id="step-1" className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all">
                    <div 
                        className={`px-4 py-4 md:px-5 flex items-center justify-between cursor-pointer ${activeStep === 1 ? 'bg-[#1C1C1C]' : 'bg-white'}`}
                        onClick={() => setActiveStep(1)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${activeStep === 1 ? 'bg-white text-[#1C1C1C]' : 'bg-emerald-100 text-emerald-700'}`}>
                                {activeStep !== 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                            </div>
                            {activeStep === 1 ? (
                                <h2 className="text-sm md:text-base font-semibold text-white">Search Dates & Guests</h2>
                            ) : (
                                <div>{searchStep}</div>
                            )}
                        </div>
                        {activeStep !== 1 && (
                            <button className="flex justify-center flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#1C1C1C] transition-colors sm:ml-4 mt-3 sm:mt-0">
                                <Pencil className="w-3.5 h-3.5" /> Modify
                            </button>
                        )}
                    </div>
                    <AnimatePresence initial={false}>
                        {activeStep === 1 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/50">
                                    {inlineSearchEditor}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Step 2: Room */}
                <div id="step-2" className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all">
                    <div 
                        className={`px-4 py-4 md:px-5 flex items-center justify-between cursor-pointer ${activeStep === 2 ? 'bg-[#1C1C1C]' : 'bg-white'}`}
                        onClick={() => {
                            if (completedSteps.includes(1)) setActiveStep(2);
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${activeStep === 2 ? 'bg-white text-[#1C1C1C]' : (completedSteps.includes(2) && activeStep !== 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500')}`}>
                                {completedSteps.includes(2) && activeStep !== 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                            </div>
                            {activeStep === 2 ? (
                                <h2 className="text-sm md:text-base font-semibold text-white">Select a Room</h2>
                            ) : (
                                <div>{roomStep}</div>
                            )}
                        </div>
                        {completedSteps.includes(2) && activeStep !== 2 && (
                            <button className="flex justify-center flex-shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#1C1C1C] transition-colors sm:ml-4 mt-3 sm:mt-0">
                                <Pencil className="w-3.5 h-3.5" /> Modify
                            </button>
                        )}
                    </div>
                    <AnimatePresence initial={false}>
                        {activeStep === 2 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/50">
                                    {roomListContent}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Step 3: Enhance Your Stay */}
                <div id="step-3" className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all">
                    <div 
                        className={`px-4 py-4 md:px-5 flex items-center justify-between cursor-pointer ${activeStep === 3 ? 'bg-[#1C1C1C]' : 'bg-gray-50'}`}
                        onClick={() => setActiveStep(3)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${activeStep === 3 ? 'bg-white text-[#1C1C1C]' : 'bg-gray-200 text-gray-500'}`}>
                                {completedSteps.includes(3) && activeStep !== 3 ? <Check className="w-3.5 h-3.5" /> : '3'}
                            </div>
                            <h2 className={`text-sm md:text-base font-semibold ${activeStep === 3 ? 'text-white' : 'text-gray-900'}`}>
                                Enhance Your Stay
                            </h2>
                        </div>
                        {completedSteps.includes(3) && activeStep !== 3 && (
                            <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#1C1C1C] transition-colors">
                                <Pencil className="w-3 h-3" /> Modify
                            </button>
                        )}
                    </div>
                    
                    <AnimatePresence initial={false}>
                        {activeStep === 3 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <div className="p-4 md:p-5 border-t border-gray-100">
                                    <AddOnsSelector
                                        options={availableAddOns}
                                        initialSelected={selectedAddOns}
                                        onContinue={() => handleNext(4)}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Step 4: Guest Information */}
                <div id="step-4" className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all">
                    <div 
                        className={`px-4 py-4 md:px-5 flex items-center justify-between ${activeStep === 4 ? 'bg-[#1C1C1C]' : 'bg-gray-50'} ${completedSteps.includes(3) || hasGuestDetails ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                        onClick={() => {
                            if (completedSteps.includes(3) || hasGuestDetails) setActiveStep(4);
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${activeStep === 4 ? 'bg-white text-[#1C1C1C]' : 'bg-gray-200 text-gray-500'}`}>
                                {completedSteps.includes(4) && activeStep !== 4 ? <Check className="w-3.5 h-3.5" /> : '4'}
                            </div>
                            <h2 className={`text-sm md:text-base font-semibold ${activeStep === 4 ? 'text-white' : 'text-gray-900'}`}>
                                Guest Information
                            </h2>
                        </div>
                        {completedSteps.includes(4) && activeStep !== 4 && (
                            <button className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#1C1C1C] transition-colors">
                                <Pencil className="w-3 h-3" /> Modify
                            </button>
                        )}
                    </div>
                    
                    <AnimatePresence initial={false}>
                        {activeStep === 4 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <div className="p-4 md:p-5 border-t border-gray-100">
                                    {guestInfoContent}
                                    <div className="mt-6 flex justify-end">
                                        <button 
                                            onClick={() => handleNext(5)}
                                            className="px-6 py-2.5 bg-[#1C1C1C] text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors flex items-center gap-2"
                                        >
                                            Continue to Payment <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Step 5: Payment */}
                <div id="step-5" className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all mb-8">
                    <div className={`px-4 py-4 md:px-5 flex items-center gap-3 ${activeStep === 5 ? 'bg-[#1C1C1C]' : 'bg-gray-50'} ${activeStep >= 4 || hasGuestDetails ? 'opacity-100' : 'opacity-60'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${activeStep === 5 ? 'bg-white text-[#1C1C1C]' : 'bg-gray-200 text-gray-500'}`}>
                            5
                        </div>
                        <h2 className={`text-sm md:text-base font-semibold ${activeStep === 5 ? 'text-white' : 'text-gray-900'}`}>
                            Payment Details
                        </h2>
                    </div>
                    
                    <AnimatePresence initial={false}>
                        {activeStep === 5 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <div className="p-4 md:p-6 border-t border-gray-100">
                                    {paymentContent}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

            {/* Sticky Order Summary Sidebar */}
            <div className="w-full lg:w-[400px] flex-shrink-0">
                <div className="lg:sticky lg:top-8 transition-all duration-300">
                    {orderSummary}
                </div>
            </div>
        </div>
    );
}
