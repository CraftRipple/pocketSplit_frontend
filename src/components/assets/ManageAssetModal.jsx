import { useState, useEffect } from 'react';
import { 
  getSharedAssetDetails, 
  shareAsset, 
  updateSharedAsset,
  getAssetAnalytics,
  exportAssetReport,
  deleteAsset
} from '../../services/api';
import SessionManager from './SessionManager';
import UsageAnalytics from './UsageAnalytics';

export default function ManageAssetModal({ isOpen, onClose, asset, onAssetUpdated }) {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [shareForm, setShareForm] = useState({
    username: '',
    monthly_hours_allocated: ''
  });
  const [sharedWith, setSharedWith] = useState([]);

  useEffect(() => {
    if (isOpen && asset) {
      // Reset states when modal opens
      setError('');
      setAnalytics(null);
      setSharedWith([]);
      
      // For shared assets, we already have the analytics data
      if (!asset.owner) {
        setAnalytics({
          current_month: {
            total_hours_used: asset.current_usage || 0,
            hours_remaining: asset.remaining_hours || 0,
            cost_incurred: (asset.current_usage || 0) * (asset.subscription_cost || 0) / (asset.monthly_hours_allocated || 1)
          },
          weekly_breakdown: [] // We'll need to fetch this separately if needed
        });
      } else {
        fetchAnalytics();
        fetchSharedDetails();
      }
    }
  }, [isOpen, asset]);

  const fetchAnalytics = async () => {
    try {
      // For owned assets, we need to get analytics
      const response = await getAssetAnalytics(asset.id);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Failed to load analytics');
    }
  };

  const fetchSharedDetails = async () => {
    try {
      const response = await getSharedAssetDetails(asset.id);
      setSharedWith(Array.isArray(response.data) ? response.data : [response.data]);
    } catch (error) {
      console.error('Failed to load sharing details:', error);
      setError('Failed to load sharing details');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await shareAsset(asset.id, {
        username: shareForm.username,
        monthly_hours_allocated: parseInt(shareForm.monthly_hours_allocated)
      });
      setShareForm({ username: '', monthly_hours_allocated: '' });
      await fetchSharedDetails();
      onAssetUpdated();
    } catch (error) {
      console.error('Share error:', error);
      setError(error.response?.data?.detail || 'Failed to share asset');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAllocation = async (sharedAssetId, hours) => {
    try {
      await updateSharedAsset(sharedAssetId, { monthly_hours_allocated: parseInt(hours) });
      await fetchSharedDetails();
      onAssetUpdated();
    } catch (error) {
      console.error('Update allocation error:', error);
      setError('Failed to update allocation');
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await exportAssetReport(asset.id);
      // Create and download the CSV file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `asset_report_${asset.id}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report');
    }
  };

  const handleDeleteAsset = async () => {
    if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      try {
        await deleteAsset(asset.id);
        onClose();
        onAssetUpdated();
      } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete asset');
      }
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{asset.name || asset.asset_name}</h2>
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
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Details
            </button>
            {asset.owner && (
              <button
                onClick={() => setActiveTab('share')}
                className={`${
                  activeTab === 'share'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Share
              </button>
            )}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Analytics
            </button>
            {!asset.owner && (
              <button
                onClick={() => setActiveTab('session')}
                className={`${
                  activeTab === 'session'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Session
              </button>
            )}
          </nav>
        </div>

        <div className="mt-4">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Asset Details</h3>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{asset.name || asset.asset_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Monthly Cost</dt>
                    <dd className="mt-1 text-sm text-gray-900">${asset.subscription_cost}</dd>
                  </div>
                  {!asset.owner && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Shared By</dt>
                      <dd className="mt-1 text-sm text-gray-900">{asset.owner}</dd>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{asset.description || 'No description provided'}</dd>
                  </div>
                </dl>
              </div>

              {asset.owner === true && (
                <div className="pt-4">
                  <button
                    onClick={handleDeleteAsset}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Asset
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'share' && asset.owner && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Share Asset</h3>
                <form onSubmit={handleShare} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      required
                      value={shareForm.username}
                      onChange={(e) => setShareForm(prev => ({ ...prev, username: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                      Monthly Hours Allocated
                    </label>
                    <input
                      type="number"
                      name="hours"
                      id="hours"
                      required
                      min="1"
                      max="744"
                      value={shareForm.monthly_hours_allocated}
                      onChange={(e) => setShareForm(prev => ({ ...prev, monthly_hours_allocated: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Sharing...' : 'Share Asset'}
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Shared With</h3>
                <div className="mt-4">
                  {sharedWith.length === 0 ? (
                    <p className="text-sm text-gray-500">This asset hasn't been shared with anyone yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {sharedWith.map((share) => (
                        <li key={share.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{share.shared_with_username}</p>
                              <p className="text-sm text-gray-500">
                                {share.current_usage} / {share.monthly_hours_allocated} hours used
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <input
                                type="number"
                                min="1"
                                max="744"
                                value={share.monthly_hours_allocated}
                                onChange={(e) => handleUpdateAllocation(share.id, e.target.value)}
                                className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                              <span className="text-sm text-gray-500">hours/month</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <UsageAnalytics asset={asset} />
          )}

          {activeTab === 'session' && !asset.owner && (
            <SessionManager 
              asset={asset} 
              onSessionUpdate={onAssetUpdated}
            />
          )}
        </div>
      </div>
    </div>
  );
} 