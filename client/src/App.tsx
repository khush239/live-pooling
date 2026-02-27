import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import SidePanel from './components/SidePanel';
import KickedScreen from './components/KickedScreen';
import { useSocket } from './hooks/useSocket';

const App: React.FC = () => {
  const [user, setUser] = useState<{ name: string; role: 'teacher' | 'student' } | null>(() => {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isKicked, setIsKicked] = useState(false);

  const { socket, participants } = useSocket(user?.name || '', user?.role || '');

  useEffect(() => {
    if (socket) {
      socket.on('kicked', () => {
        setIsKicked(true);
        sessionStorage.clear();
      });
    }
    return () => {
      socket?.off('kicked');
    };
  }, [socket]);

  const handleOnboarding = (name: string, role: 'teacher' | 'student') => {
    const userData = { name, role };
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  if (isKicked) {
    return <KickedScreen />;
  }

  if (!user) {
    return <Onboarding onComplete={handleOnboarding} />;
  }

  return (
    <div className="app-container">
      {user.role === 'teacher' ? (
        <TeacherDashboard
          name={user.name}
          socket={socket}
          participants={participants}
        />
      ) : (
        <StudentDashboard
          name={user.name}
          socket={socket}
          participants={participants}
        />
      )}
      <SidePanel
        socket={socket}
        participants={participants}
        userName={user.name}
        isTeacher={user.role === 'teacher'}
      />
    </div>
  );
};

export default App;
