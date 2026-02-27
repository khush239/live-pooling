import React, { useState } from 'react';

interface Props {
    onComplete: (name: string, role: 'teacher' | 'student') => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<'teacher' | 'student' | null>(null);
    const [name, setName] = useState('');

    const handleContinue = () => {
        if (step === 1 && role) {
            setStep(2);
        } else if (step === 2 && name.trim()) {
            onComplete(name, role!);
        }
    };

    return (
        <div className="onboarding-card">
            <div className="badge">Intervue Poll</div>

            {step === 1 ? (
                <>
                    <h1 className="onboarding-title">Welcome to the <span>Live Polling System</span></h1>
                    <p className="onboarding-subtitle">Please select the role that best describes you to begin using the live polling system</p>

                    <div className="role-selector">
                        <div
                            className={`role-option ${role === 'student' ? 'active' : ''}`}
                            onClick={() => setRole('student')}
                        >
                            <h3 className="role-title">I'm a Student</h3>
                            <p className="role-desc">Lorem Ipsum is simply dummy text of the printing and typesetting industry</p>
                        </div>

                        <div
                            className={`role-option ${role === 'teacher' ? 'active' : ''}`}
                            onClick={() => setRole('teacher')}
                        >
                            <h3 className="role-title">I'm a Teacher</h3>
                            <p className="role-desc">Submit answers and view live poll results in real-time.</p>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <h1 className="onboarding-title">Let's <span>Get Started</span></h1>
                    <p className="onboarding-subtitle">
                        {role === 'teacher'
                            ? "You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time."
                            : "If you're a student, you'll be able to submit your answers, participate in live polls, and see how your responses compare with your classmates."}
                    </p>

                    <div className="input-group-centered">
                        <label>Enter your Name</label>
                        <input
                            type="text"
                            placeholder="Ex: Rahul Bajaj"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                            autoFocus
                        />
                    </div>
                </>
            )}

            <button
                className="btn-primary"
                onClick={handleContinue}
                disabled={step === 1 ? !role : !name.trim()}
            >
                Continue
            </button>
        </div>
    );
};

export default Onboarding;
