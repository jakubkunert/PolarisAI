import React from 'react';
import { isFeatureEnabled } from '@/core/config/deployment';

interface FeatureFlagProps {
  feature: 'analytics' | 'teamCollaboration' | 'customDomain' | 'advancedSecurity';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({ 
  feature, 
  children, 
  fallback = null 
}) => {
  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

// Example usage components
export const TeamCollaborationButton: React.FC = () => (
  <FeatureFlag feature="teamCollaboration">
    <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
      Invite Team Members
    </button>
  </FeatureFlag>
);

export const AnalyticsDashboard: React.FC = () => (
  <FeatureFlag feature="analytics">
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold text-gray-900">Analytics Dashboard</h3>
      <div className="mt-2 space-y-2">
        <div className="flex justify-between">
          <span>Total Conversations</span>
          <span className="font-medium">1,234</span>
        </div>
        <div className="flex justify-between">
          <span>Active Agents</span>
          <span className="font-medium">5</span>
        </div>
        <div className="flex justify-between">
          <span>Average Confidence</span>
          <span className="font-medium">87%</span>
        </div>
      </div>
    </div>
  </FeatureFlag>
);

export const CommunitySupport: React.FC = () => (
  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <h3 className="font-semibold text-blue-800">Community Support</h3>
    <p className="text-sm text-blue-700">
      Get help from our community forum and GitHub issues
    </p>
    <div className="mt-2 space-x-2">
      <a 
        href="https://github.com/jakubkunert/PolarisAI/issues"
        className="text-sm text-blue-600 hover:underline"
      >
        GitHub Issues →
      </a>
      <a 
        href="https://github.com/jakubkunert/PolarisAI/discussions"
        className="text-sm text-blue-600 hover:underline"
      >
        Discussions →
      </a>
    </div>
  </div>
);

// Deployment mode indicator
export const DeploymentModeIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-600">Mode:</span>
      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
        Self-Hosted
      </span>
    </div>
  );
};

// Feature availability overview
export const FeatureOverview: React.FC = () => {
  const features = [
    { key: 'analytics', label: 'Analytics Dashboard' },
    { key: 'teamCollaboration', label: 'Team Collaboration' },
    { key: 'customDomain', label: 'Custom Domain' },
    { key: 'advancedSecurity', label: 'Advanced Security' },
  ] as const;
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold text-gray-900 mb-3">Available Features</h3>
      <div className="space-y-2">
        {features.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{label}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
              Available
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500">
        All features are included in the open source version
      </div>
    </div>
  );
}; 