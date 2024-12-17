import { useEffect, useState } from 'react';
import { getAssets, getSharedAssets } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AddAssetModal from '../assets/AddAssetModal';
import ManageAssetModal from '../assets/ManageAssetModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [sharedAssets, setSharedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assetsResponse, sharedResponse] = await Promise.all([
        getAssets(),
        getSharedAssets()
      ]);
      
      // Get owned assets
      const myAssets = assetsResponse.data?.results || assetsResponse.data || [];
      setAssets(myAssets);
      
      // Get shared assets
      const allSharedAssets = sharedResponse.data?.results || sharedResponse.data || [];
      
      // Create a set of owned asset names for efficient lookup
      const ownedAssetNames = new Set(myAssets.map(asset => asset.name));
      
      // Filter out shared assets that are already in My Assets
      const sharedWithMe = allSharedAssets.filter(shared => 
        !ownedAssetNames.has(shared.asset_name)
      );
      
      setSharedAssets(sharedWithMe);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleAssetAdded = (newAsset) => {
    setAssets(prevAssets => [...prevAssets, newAsset]);
  };

  const handleManageAsset = (asset) => {
    setSelectedAsset(asset);
    setIsManageModalOpen(true);
  };

  const handleAssetUpdated = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="text-lg text-gray-600">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Asset
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* My Assets Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">My Assets</h2>
              {assets.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No assets found</p>
                  <p className="mt-1 text-sm text-gray-500">Add your first asset to get started</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {assets.map((asset) => (
                    <li key={asset.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{asset.name}</h3>
                          <p className="text-sm text-gray-500">
                            ${asset.subscription_cost}/month
                          </p>
                        </div>
                        <button
                          onClick={() => handleManageAsset({ ...asset, owner: true })}
                          className="text-sm text-blue-600 hover:text-blue-900"
                        >
                          Manage
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Shared With Me Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Shared With Me</h2>
              {sharedAssets.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No shared assets found</p>
                  <p className="mt-1 text-sm text-gray-500">Assets shared with you will appear here</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {sharedAssets.map((shared) => (
                    <li key={shared.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{shared.asset_name}</h3>
                          <p className="text-sm text-gray-500">
                            Shared by: {shared.owner}
                          </p>
                          <p className="text-sm text-gray-500">
                            {shared.current_usage}/{shared.monthly_hours_allocated} hours used
                          </p>
                        </div>
                        <button
                          onClick={() => handleManageAsset({ ...shared, owner: false })}
                          className="text-sm text-blue-600 hover:text-blue-900"
                        >
                          View Usage
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAssetAdded={handleAssetAdded}
      />

      <ManageAssetModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
        onAssetUpdated={handleAssetUpdated}
      />
    </>
  );
} 