import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Eye, GitCompare, Calendar, User, ArrowLeft, ArrowRight, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useApi } from '../../utils/useApi';
import { useTranslation } from 'react-i18next';

interface VersionHistoryProps {
  onPlanRestored?: () => void;
  isVisible: boolean;
  onClose: () => void;
}

interface PlanVersion {
  id: number;
  version_number: number;
  created_at: string;
  change_type: string;
  change_description: string;
  changed_by: string;
  changed_fields?: string[];
  previous_values?: any;
  new_values?: any;
}

interface VersionComparison {
  version1: PlanVersion;
  version2: PlanVersion;
  differences: {
    field: string;
    previous: any;
    current: any;
  }[];
}

export const PlanVersionHistory: React.FC<VersionHistoryProps> = ({
  onPlanRestored,
  isVisible,
  onClose
}) => {
  const { t } = useTranslation();
  const { makeRequest } = useApi();
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<PlanVersion | null>(null);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchVersionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await makeRequest('plan-version-history', {
        method: 'GET'
      });
      setVersions(response.versions || []);
    } catch (err: any) {
      console.error('Error fetching version history:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      setRestoring(true);
      await makeRequest('restore-plan-version', {
        method: 'POST',
        body: JSON.stringify({ version_id: versionId })
      });
      
      // Call the callback to refresh the main plan
      if (onPlanRestored) {
        onPlanRestored();
      }
      
      // Close the modal
      onClose();
    } catch (err: any) {
      console.error('Error restoring version:', err);
      setError('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const handleCompareVersions = async (version1Id: number, version2Id: number) => {
    try {
      setComparing(true);
      const response = await makeRequest('compare-plan-versions', {
        method: 'POST',
        body: JSON.stringify({ 
          version1_id: version1Id, 
          version2_id: version2Id 
        })
      });
      setComparison(response);
    } catch (err: any) {
      console.error('Error comparing versions:', err);
      setError('Failed to compare versions');
    } finally {
      setComparing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType.toLowerCase()) {
      case 'morning_routine':
        return '🌅';
      case 'daily_plan':
        return '📅';
      case 'weekly_challenges':
        return '🏆';
      case 'system_building':
        return '🏗️';
      default:
        return '📝';
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType.toLowerCase()) {
      case 'morning_routine':
        return 'Morning Routine';
      case 'daily_plan':
        return 'Daily Plan';
      case 'weekly_challenges':
        return 'Weekly Challenges';
      case 'system_building':
        return 'System Building';
      default:
        return changeType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchVersionHistory();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Plan Version History</h2>
              <p className="text-sm text-gray-600">View and restore previous versions of your plan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading version history...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchVersionHistory}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No version history available yet</p>
                <p className="text-sm text-gray-500 mt-2">Make changes to your plan to see version history</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                        {getChangeTypeIcon(version.change_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            Version {version.version_number}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {getChangeTypeLabel(version.change_type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {version.change_description || 'Plan updated'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(version.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {version.changed_by === 'leo' ? 'Leo AI' : version.changed_by}
                          </div>
                        </div>
                        {version.changed_fields && version.changed_fields.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">Changed fields:</p>
                            <div className="flex flex-wrap gap-1">
                              {version.changed_fields.map((field, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {index > 0 && (
                        <button
                          onClick={() => handleCompareVersions(versions[index - 1].id, version.id)}
                          disabled={comparing}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Compare with previous version"
                        >
                          <GitCompare className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        disabled={restoring}
                        className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        {restoring ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Version Comparison Modal */}
        {comparison && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Version Comparison</h3>
                <button
                  onClick={() => setComparison(null)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Version {comparison.version1.version_number}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(comparison.version1.created_at)}
                    </p>
                  </div>
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Version {comparison.version2.version_number}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(comparison.version2.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {comparison.differences.map((diff, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-3">{diff.field}</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Previous</p>
                          <div className="bg-red-50 border border-red-200 rounded p-3">
                            <pre className="text-sm text-red-800 whitespace-pre-wrap">
                              {JSON.stringify(diff.previous, null, 2)}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Current</p>
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <pre className="text-sm text-green-800 whitespace-pre-wrap">
                              {JSON.stringify(diff.current, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 