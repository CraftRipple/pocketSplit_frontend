import React, { useState, useEffect } from 'react';
import { UsageAnalytics as AnalyticsData } from '../../types';
import { getAssetAnalytics, getSharedAssetAnalytics } from '../../services/api';

interface UsageAnalyticsProps {
  assetId: number;
  sharedAssetId?: number;
}

const UsageAnalytics: React.FC<UsageAnalyticsProps> = ({ assetId, sharedAssetId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [assetId, sharedAssetId]);

  const fetchAnalytics = async () => {
    try {
      const response = sharedAssetId
        ? await getSharedAssetAnalytics(sharedAssetId)
        : await getAssetAnalytics(assetId);
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data');
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-gray-500 p-4">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Month Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Total Hours Used</h4>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {analytics.current_month.total_hours_used.toFixed(1)}h
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Hours Remaining</h4>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {analytics.current_month.hours_remaining.toFixed(1)}h
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Cost Incurred</h4>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            ${analytics.current_month.cost_incurred.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-500">Usage Progress</h4>
          <span className="text-sm text-gray-500">
            {analytics.usage_percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              analytics.usage_percentage > 90
                ? 'bg-red-600'
                : analytics.usage_percentage > 75
                ? 'bg-yellow-400'
                : 'bg-green-600'
            }`}
            style={{ width: `${Math.min(analytics.usage_percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h4 className="text-sm font-medium text-gray-500 mb-4">Weekly Usage</h4>
        <div className="space-y-4">
          {analytics.weekly_breakdown.map((week, index) => (
            <div key={index} className="flex items-center">
              <span className="text-sm text-gray-500 w-24">Week {week.week}</span>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-indigo-600"
                    style={{
                      width: `${(week.hours / Math.max(...analytics.weekly_breakdown.map(w => w.hours))) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              <span className="text-sm text-gray-500 w-20 text-right">
                {week.hours.toFixed(1)}h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsageAnalytics; 