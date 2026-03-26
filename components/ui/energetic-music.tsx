'use client';

import { useEffect, useRef, useState } from 'react';

export default function EnergeticMusic() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = 0.3;

        const tryPlay = () => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        console.log('🎵 Music started playing');
                    })
                    .catch((err) => {
                        console.log('🎵 Autoplay blocked, waiting for interaction');
                    });
            }
        };

        // Try to play immediately
        tryPlay();

        // Set up fallback for when user interacts with the page
        const handleInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
                tryPlay();
            }
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('keydown', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);

        return () => {
            document.removeEventListener('click', handleInteraction);
            document.removeEventListener('keydown', handleInteraction);
            document.removeEventListener('touchstart', handleInteraction);
        };
    }, [hasInteracted]);

    return (
        <div className="fixed top-4 right-4 z-[200] opacity-50">
            <audio
                ref={audioRef}
                loop
                preload="auto"
                src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
            />
            {isPlaying && (
                <div className="text-xs text-white/50">🎵 Music</div>
            )}
        </div>
    );
}
