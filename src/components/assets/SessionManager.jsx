import { useState, useEffect } from 'react';
import { startSession, endSession, getActiveSession } from '../../services/api';

export default function SessionManager({ asset, onSessionUpdate }) {
  const [activeSession, setActiveSession] = useState(null);
  const [timer, setTimer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkActiveSession();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [asset.id]);

  const checkActiveSession = async () => {
    try {
      const response = await getActiveSession(asset.id);
      if (response.data) {
        setActiveSession(response.data);
        startTimer(response.data.start_time);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
    }
  };

  const startTimer = (startTime) => {
    const timer = setInterval(() => {
      const start = new Date(startTime);
      const now = new Date();
      const duration = Math.floor((now - start) / 1000); // duration in seconds
      setTimer(duration);
    }, 1000);
    setTimer(timer);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = async () => {
    try {
      setError(null);
      const response = await startSession(asset.id);
      setActiveSession(response.data);
      startTimer(response.data.start_time);
      if (onSessionUpdate) onSessionUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    }
  };

  const handleEndSession = async () => {
    try {
      setError(null);
      await endSession(asset.id);
      setActiveSession(null);
      if (timer) clearInterval(timer);
      setTimer(null);
      if (onSessionUpdate) onSessionUpdate();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end session');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Session Management
          </h3>
          
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-5">
            {activeSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active Session
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Started at: {new Date(activeSession.start_time).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-2xl font-mono">
                    {formatDuration(timer)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleEndSession}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  End Session
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartSession}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Session
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 