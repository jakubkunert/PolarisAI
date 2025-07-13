export interface DeploymentConfig {
  mode: 'self-hosted';
  features: {
    analytics: boolean;
    teamCollaboration: boolean;
    customDomain: boolean;
    advancedSecurity: boolean;
  };
  limits: {
    maxAgents: number;
    maxConversations: number;
    maxMemorySize: number;
    apiRequestsPerMonth: number;
  };
}

export const getDeploymentConfig = (): DeploymentConfig => {
  // For now, everything is self-hosted with all features enabled
  return {
    mode: 'self-hosted',
    features: {
      analytics: true,
      teamCollaboration: true,
      customDomain: true,
      advancedSecurity: true,
    },
    limits: {
      maxAgents: Infinity,
      maxConversations: Infinity,
      maxMemorySize: Infinity,
      apiRequestsPerMonth: Infinity,
    },
  };
};

export const isFeatureEnabled = (feature: keyof DeploymentConfig['features']): boolean => {
  const config = getDeploymentConfig();
  return config.features[feature];
};

export const checkLimit = (limit: keyof DeploymentConfig['limits'], current: number): boolean => {
  const config = getDeploymentConfig();
  const maxAllowed = config.limits[limit];
  return maxAllowed === Infinity || current < maxAllowed;
}; 