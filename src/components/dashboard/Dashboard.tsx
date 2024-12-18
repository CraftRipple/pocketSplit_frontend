import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../services/api';
import { Asset, SharedAsset } from '../../types';
import AddAssetModal from '../assets/AddAssetModal';
import ManageAssetModal from '../assets/ManageAssetModal';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [ownedAssets, setOwnedAssets] = useState<Asset[]>([]);
  const [sharedAssets, setSharedAssets] = useState<SharedAsset[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | SharedAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const [ownedResponse, sharedResponse] = await Promise.all([
        api.getAssets(),
        api.getSharedAssets()
      ]);
      setOwnedAssets(ownedResponse.data);
      setSharedAssets(sharedResponse.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch assets');
      setLoading(false);
    }
  };

  const handleAddAsset = () => {
    setIsAddModalOpen(true);
  };

  const handleManageAsset = (asset: Asset | SharedAsset) => {
    setSelectedAsset(asset);
    setIsManageModalOpen(true);
  };

  const handleAssetAdded = (newAsset: Asset) => {
    setOwnedAssets(prev => [...prev, newAsset]);
    setIsAddModalOpen(false);
  };

  const handleAssetUpdated = (updatedAsset: Asset | SharedAsset) => {
    if ('id' in updatedAsset) {
      setOwnedAssets(prev =>
        prev.map(asset => (asset.id === updatedAsset.id ? updatedAsset : asset))
      );
    } else {
      setSharedAssets(prev =>
        prev.map(asset => (asset.asset === updatedAsset.asset ? updatedAsset : asset))
      );
    }
    setIsManageModalOpen(false);
    setSelectedAsset(null);
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img className="h-8 w-auto" src="/logo.svg" alt="PocketSplit" />
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Your Assets</h1>
            <button
              onClick={handleAddAsset}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Asset
            </button>
          </div>

          {/* Owned Assets */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Owned Assets</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ownedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">{asset.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{asset.description}</p>
                    <p className="mt-2 text-sm text-gray-900">Cost: ${asset.subscription_cost}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Shared with: {asset.shared_with.length} users
                    </p>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <button
                      onClick={() => handleManageAsset(asset)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      Manage Asset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shared Assets */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shared With You</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sharedAssets.map((asset) => (
                <div
                  key={asset.asset}
                  className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">{asset.asset_name}</h3>
                    <p className="mt-1 text-sm text-gray-500">Owned by: {asset.owner_username}</p>
                    <p className="mt-2 text-sm text-gray-900">
                      Monthly Hours: {asset.monthly_hours_allocated}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Usage This Month: {asset.usage_this_month} hours
                    </p>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <button
                      onClick={() => handleManageAsset(asset)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      Manage Asset
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <AddAssetModal
          onClose={() => setIsAddModalOpen(false)}
          onAssetAdded={handleAssetAdded}
        />
      )}

      {isManageModalOpen && selectedAsset && (
        <ManageAssetModal
          asset={selectedAsset}
          onClose={() => {
            setIsManageModalOpen(false);
            setSelectedAsset(null);
          }}
          onAssetUpdated={handleAssetUpdated}
        />
      )}
    </div>
  );
};

export default Dashboard; 