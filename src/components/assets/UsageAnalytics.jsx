import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { getAssetAnalytics } from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function UsageAnalytics({ asset }) {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [asset.id, period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAssetAnalytics(asset.id);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.response?.data?.error || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!analytics?.weekly_breakdown) return null;

    const labels = analytics.weekly_breakdown.map(week => `Week ${week.week}`);
    const data = analytics.weekly_breakdown.map(week => week.hours);

    return {
      labels,
      datasets: [
        {
          label: 'Usage Hours',
          data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    };
  };

  const chartData = prepareChartData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${period === 'weekly' ? 'Weekly' : 'Monthly'} Usage Trends`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Total Usage</p>
            <p className="text-2xl font-semibold text-blue-900">
              {analytics?.current_month?.total_hours_used?.toFixed(1) || '0'} hrs
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">Monthly Allocation</p>
            <p className="text-2xl font-semibold text-green-900">
              {(analytics?.current_month?.total_hours_used + analytics?.current_month?.hours_remaining)?.toFixed(1) || '0'} hrs
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600">Remaining Time</p>
            <p className="text-2xl font-semibold text-yellow-900">
              {analytics?.current_month?.hours_remaining?.toFixed(1) || '0'} hrs
            </p>
          </div>
        </div>
        
        {/* Usage Percentage */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Usage Progress</span>
            <span>{analytics?.usage_percentage?.toFixed(1) || '0'}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${analytics?.usage_percentage || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Usage Trends */}
      {chartData && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Usage Trends</h3>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
} 