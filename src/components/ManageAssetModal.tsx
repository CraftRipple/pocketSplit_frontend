import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { Asset, Session, UsageAnalytics, SharedAsset } from '../types';

interface ManageAssetModalProps {
  asset: Asset | SharedAsset;
  onClose: () => void;
  onAssetUpdated: (asset: Asset | SharedAsset) => void;
}

interface TabProps {
  name: string;
  current: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ name, current, onClick }) => (
  <button
    onClick={onClick}
    className={`${
      current
        ? 'border-indigo-500 text-indigo-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
  >
    {name}
  </button>
);

const ManageAssetModal: React.FC<ManageAssetModalProps> = ({ asset, onClose, onAssetUpdated }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'analytics' | 'history'>('details');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareFormData, setShareFormData] = useState({
    username: '',
    monthly_hours_allocated: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: ('id' in asset) ? (asset as Asset).name : (asset as SharedAsset).asset_name,
    description: ('id' in asset) ? (asset as Asset).description : '',
    subscription_cost: ('id' in asset) ? (asset as Asset).subscription_cost.toString() : '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchActiveSession();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchActiveSession = async () => {
    if (!('id' in asset)) return;
    try {
      const response = await api.getActiveSession(asset.id);
      setActiveSession(response.data);
    } catch (err) {
      console.error('Error fetching active session:', err);
    }
  };

  const fetchAnalytics = async () => {
    if (!('id' in asset)) return;
    try {
      const response = await api.getAssetAnalytics(asset.id);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!('id' in asset)) return;

    if (!editFormData.name.trim() || !editFormData.subscription_cost) {
      setError('Name and subscription cost are required');
      return;
    }

    const costValue = parseFloat(editFormData.subscription_cost);
    if (isNaN(costValue) || costValue <= 0) {
      setError('Subscription cost must be a positive number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.updateAsset(asset.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        subscription_cost: costValue,
      });
      onAssetUpdated(response.data);
      setIsEditing(false);
      onClose();
    } catch (err) {
      setError('Failed to update asset');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    if (!('id' in asset)) return;
    setLoading(true);
    try {
      const response = await api.startSession(asset.id);
      setActiveSession(response.data);
    } catch (err) {
      setError('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!('id' in asset) || !activeSession) return;
    setLoading(true);
    try {
      await api.endSession(asset.id);
      setActiveSession(null);
    } catch (err) {
      setError('Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <Tab
                name="Details"
                current={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
              />
              <Tab
                name="Sessions"
                current={activeTab === 'sessions'}
                onClick={() => setActiveTab('sessions')}
              />
              <Tab
                name="Analytics"
                current={activeTab === 'analytics'}
                onClick={() => setActiveTab('analytics')}
              />
            </nav>
          </div>

          <div className="mt-5">
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {activeTab === 'details' && (
              <form onSubmit={handleEdit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Asset Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="subscription_cost" className="block text-sm font-medium text-gray-700">
                      Subscription Cost ($)
                    </label>
                    <input
                      type="number"
                      id="subscription_cost"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={editFormData.subscription_cost}
                      onChange={(e) => setEditFormData({ ...editFormData, subscription_cost: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </form>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900">Active Session</h4>
                  {activeSession ? (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Started: {new Date(activeSession.start_time).toLocaleString()}
                      </p>
                      <button
                        onClick={handleEndSession}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        End Session
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">No active session</p>
                      <button
                        onClick={handleStartSession}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Start Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && analytics && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900">Usage Summary</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Sessions</p>
                      <p className="mt-1 text-lg font-semibold">{analytics.total_sessions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Duration</p>
                      <p className="mt-1 text-lg font-semibold">
                        {Math.round(analytics.total_duration / 60)} minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Average Session Length</p>
                      <p className="mt-1 text-lg font-semibold">
                        {Math.round(analytics.average_session_length / 60)} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            {activeTab === 'details' && (
              <button
                type="submit"
                disabled={loading}
                onClick={handleEdit}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 ${
                activeTab === 'details' ? 'sm:col-start-1' : 'sm:col-span-2'
              } sm:text-sm`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAssetModal; 