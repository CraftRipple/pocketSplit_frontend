import React, { useState } from 'react';
import { Asset, SharedAsset } from '../../types';
import { shareAsset, updateAsset, deleteAsset, updateSharedAsset } from '../../services/api';
import SessionManager from './SessionManager';
import UsageAnalytics from './UsageAnalytics';
import SessionHistory from './SessionHistory';

interface ManageAssetModalProps {
  asset: Asset | SharedAsset;
  onClose: () => void;
  onAssetUpdated: (asset: Asset | SharedAsset) => void;
}

const ManageAssetModal: React.FC<ManageAssetModalProps> = ({ asset, onClose, onAssetUpdated }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'analytics' | 'history'>('details');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareFormData, setShareFormData] = useState({
    username: '',
    monthly_hours_allocated: '',
  });
  const [editFormData, setEditFormData] = useState({
    name: 'id' in asset ? asset.name : asset.asset_name,
    description: 'id' in asset ? asset.description : '',
    subscription_cost: 'id' in asset ? asset.subscription_cost.toString() : '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!('id' in asset)) return;
    
    setLoading(true);
    try {
      await shareAsset(asset.id, {
        username: shareFormData.username,
        monthly_hours_allocated: parseInt(shareFormData.monthly_hours_allocated),
      });
      setIsSharing(false);
      setShareFormData({ username: '', monthly_hours_allocated: '' });
      onClose();
    } catch (err) {
      setError('Failed to share asset');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!('id' in asset)) {
      // Handle shared asset update
      try {
        const response = await updateSharedAsset(asset.asset, {
          monthly_hours_allocated: parseInt(shareFormData.monthly_hours_allocated),
        });
        onAssetUpdated(response.data);
        setIsEditing(false);
        onClose();
      } catch (err) {
        setError('Failed to update shared asset');
      }
      return;
    }
    
    // Handle owned asset update
    setLoading(true);
    try {
      const response = await updateAsset(asset.id, {
        name: editFormData.name,
        description: editFormData.description,
        subscription_cost: parseFloat(editFormData.subscription_cost),
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

  const handleDelete = async () => {
    if (!('id' in asset) || !window.confirm('Are you sure you want to delete this asset?')) return;
    
    setLoading(true);
    try {
      await deleteAsset(asset.id);
      onAssetUpdated(asset);
      onClose();
    } catch (err) {
      setError('Failed to delete asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {'id' in asset ? asset.name : asset.asset_name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`${
                  activeTab === 'sessions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Sessions
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`${
                  activeTab === 'analytics'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {'id' in asset ? (
                  <>
                    {!isEditing ? (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{asset.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="mt-1 text-sm text-gray-900">{asset.description || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cost</label>
                          <p className="mt-1 text-sm text-gray-900">${asset.subscription_cost}</p>
                        </div>
                        <div className="sm:col-span-2 flex justify-end space-x-3">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setIsSharing(true)}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Share
                          </button>
                          <button
                            onClick={handleDelete}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleEdit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <input
                              type="text"
                              name="description"
                              id="description"
                              value={editFormData.description}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="subscription_cost" className="block text-sm font-medium text-gray-700">Cost</label>
                            <input
                              type="number"
                              name="subscription_cost"
                              id="subscription_cost"
                              value={editFormData.subscription_cost}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, subscription_cost: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    )}

                    {isSharing && (
                      <form onSubmit={handleShare} className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                            <input
                              type="text"
                              name="username"
                              id="username"
                              value={shareFormData.username}
                              onChange={(e) => setShareFormData(prev => ({ ...prev, username: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label htmlFor="monthly_hours_allocated" className="block text-sm font-medium text-gray-700">Monthly Hours</label>
                            <input
                              type="number"
                              name="monthly_hours_allocated"
                              id="monthly_hours_allocated"
                              value={shareFormData.monthly_hours_allocated}
                              onChange={(e) => setShareFormData(prev => ({ ...prev, monthly_hours_allocated: e.target.value }))}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setIsSharing(false)}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Share Asset
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                ) : (
                  // Shared asset details view
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset Name</label>
                      <p className="mt-1 text-sm text-gray-900">{asset.asset_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Owner</label>
                      <p className="mt-1 text-sm text-gray-900">{asset.owner_username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Monthly Hours Allocated</label>
                      <p className="mt-1 text-sm text-gray-900">{asset.monthly_hours_allocated} hours</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Usage This Month</label>
                      <p className="mt-1 text-sm text-gray-900">{asset.usage_this_month} hours</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <SessionManager
                assetId={'id' in asset ? asset.id : asset.asset}
                sharedAssetId={'id' in asset ? undefined : asset.asset}
              />
            )}

            {activeTab === 'history' && (
              <SessionHistory
                assetId={'id' in asset ? asset.id : asset.asset}
                sharedAssetId={'id' in asset ? undefined : asset.asset}
              />
            )}

            {activeTab === 'analytics' && (
              <UsageAnalytics
                assetId={'id' in asset ? asset.id : asset.asset}
                sharedAssetId={'id' in asset ? undefined : asset.asset}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAssetModal; 