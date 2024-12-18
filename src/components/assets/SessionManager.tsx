import React, { useState, useEffect } from 'react';
import { Session } from '../../types';
import { startSession, endSession, getActiveSession } from '../../services/api';

interface SessionManagerProps {
  assetId: number;
  sharedAssetId?: number;
}

const SessionManager: React.FC<SessionManagerProps> = ({ assetId, sharedAssetId }) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveSession();
  }, [assetId, sharedAssetId]);

  const fetchActiveSession = async () => {
    try {
      const response = await getActiveSession(sharedAssetId || assetId);
      setActiveSession(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching active session:', err);
      setError('Failed to fetch session status');
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    try {
      setLoading(true);
      const response = await startSession(sharedAssetId || assetId);
      setActiveSession(response.data);
      setError(null);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      setLoading(true);
      await endSession(sharedAssetId || assetId);
      setActiveSession(null);
      setError(null);
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
      
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {activeSession ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Active Session</p>
                <p className="text-sm font-medium text-gray-900">
                  Started: {new Date(activeSession.start_time).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleEndSession}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={loading}
              >
                End Session
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">No active session</p>
            <button
              onClick={handleStartSession}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              Start New Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager; 