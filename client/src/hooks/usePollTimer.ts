import { useState, useEffect } from 'react';

export const usePollTimer = (initialTime: number | null, onEnd?: () => void) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(initialTime);

    useEffect(() => {
        if (initialTime === null) return;
        setTimeLeft(initialTime);
    }, [initialTime]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) {
            if (timeLeft === 0 && onEnd) onEnd();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    if (onEnd) onEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onEnd]);

    return timeLeft;
};
