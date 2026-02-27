import React from 'react';
import { Sparkles } from 'lucide-react';

const KickedScreen: React.FC = () => {
    return (
        <div className="onboarding-card">
            <div className="badge">
                <Sparkles size={16} fill="white" />
                Intervue Poll
            </div>
            <h1 style={{ fontSize: '3rem', marginTop: '1rem' }}>You've been Kicked out !</h1>
            <p style={{ maxWidth: '80%', margin: '0 auto 2rem' }}>
                Looks like the teacher had removed you from the poll system. Please Try again sometime.
            </p>
        </div>
    );
};

export default KickedScreen;
