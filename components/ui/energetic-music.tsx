'use client';

import { useEffect, useRef } from 'react';

export default function EnergeticMusic() {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.5; // Start at 50% volume so it's not deafening

        // Try playing immediately
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay was blocked by the browser. 
                // Set up a one-time listener for the first interaction to start the music smoothly.
                const playOnInteraction = () => {
                    audio.play().catch(console.error); // Safe catch
                    // Clean up listeners once playing
                    document.removeEventListener('click', playOnInteraction);
                    document.removeEventListener('keydown', playOnInteraction);
                    document.removeEventListener('touchstart', playOnInteraction);
                };

                document.addEventListener('click', playOnInteraction, { once: true });
                document.addEventListener('keydown', playOnInteraction, { once: true });
                document.addEventListener('touchstart', playOnInteraction, { once: true });
            });
        }
    }, []);

    return (
        <audio 
            ref={audioRef} 
            loop 
            hidden 
            className="hidden pointer-events-none"
            src="https://raw.githubusercontent.com/mdn/webaudio-examples/master/audio-analyser/viper.mp3" 
        />
    );
}
