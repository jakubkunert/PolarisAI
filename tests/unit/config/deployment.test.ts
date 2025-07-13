import { describe, it, expect } from '@jest/globals';
import {
  DeploymentConfig,
  getDeploymentConfig,
  isFeatureEnabled,
  checkLimit
} from '@/core/config/deployment';

describe('Deployment Configuration', () => {
  describe('getDeploymentConfig', () => {
    it('should return correct deployment configuration', () => {
      const config = getDeploymentConfig();

      expect(config).toEqual({
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
      });
    });

    it('should return the same configuration on multiple calls', () => {
      const config1 = getDeploymentConfig();
      const config2 = getDeploymentConfig();

      expect(config1).toEqual(config2);
    });

    it('should have correct mode', () => {
      const config = getDeploymentConfig();
      expect(config.mode).toBe('self-hosted');
    });

    it('should have all features enabled by default', () => {
      const config = getDeploymentConfig();

      expect(config.features.analytics).toBe(true);
      expect(config.features.teamCollaboration).toBe(true);
      expect(config.features.customDomain).toBe(true);
      expect(config.features.advancedSecurity).toBe(true);
    });

    it('should have unlimited limits by default', () => {
      const config = getDeploymentConfig();

      expect(config.limits.maxAgents).toBe(Infinity);
      expect(config.limits.maxConversations).toBe(Infinity);
      expect(config.limits.maxMemorySize).toBe(Infinity);
      expect(config.limits.apiRequestsPerMonth).toBe(Infinity);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for analytics feature', () => {
      expect(isFeatureEnabled('analytics')).toBe(true);
    });

    it('should return true for teamCollaboration feature', () => {
      expect(isFeatureEnabled('teamCollaboration')).toBe(true);
    });

    it('should return true for customDomain feature', () => {
      expect(isFeatureEnabled('customDomain')).toBe(true);
    });

    it('should return true for advancedSecurity feature', () => {
      expect(isFeatureEnabled('advancedSecurity')).toBe(true);
    });

    it('should work with all available features', () => {
      const config = getDeploymentConfig();
      const features = Object.keys(config.features) as Array<keyof DeploymentConfig['features']>;

      features.forEach(feature => {
        expect(isFeatureEnabled(feature)).toBe(true);
      });
    });
  });

  describe('checkLimit', () => {
    it('should return true for maxAgents limit with any value', () => {
      expect(checkLimit('maxAgents', 0)).toBe(true);
      expect(checkLimit('maxAgents', 100)).toBe(true);
      expect(checkLimit('maxAgents', 1000000)).toBe(true);
    });

    it('should return true for maxConversations limit with any value', () => {
      expect(checkLimit('maxConversations', 0)).toBe(true);
      expect(checkLimit('maxConversations', 500)).toBe(true);
      expect(checkLimit('maxConversations', 999999)).toBe(true);
    });

    it('should return true for maxMemorySize limit with any value', () => {
      expect(checkLimit('maxMemorySize', 0)).toBe(true);
      expect(checkLimit('maxMemorySize', 1024)).toBe(true);
      expect(checkLimit('maxMemorySize', 1073741824)).toBe(true); // 1GB
    });

    it('should return true for apiRequestsPerMonth limit with any value', () => {
      expect(checkLimit('apiRequestsPerMonth', 0)).toBe(true);
      expect(checkLimit('apiRequestsPerMonth', 10000)).toBe(true);
      expect(checkLimit('apiRequestsPerMonth', 1000000)).toBe(true);
    });

    it('should work with all available limits', () => {
      const config = getDeploymentConfig();
      const limits = Object.keys(config.limits) as Array<keyof DeploymentConfig['limits']>;

      limits.forEach(limit => {
        expect(checkLimit(limit, 0)).toBe(true);
        expect(checkLimit(limit, 1000)).toBe(true);
        expect(checkLimit(limit, 999999)).toBe(true);
      });
    });
  });

  describe('Configuration Structure', () => {
    it('should have proper TypeScript types', () => {
      const config = getDeploymentConfig();

      // Check that config matches DeploymentConfig interface
      expect(typeof config.mode).toBe('string');
      expect(typeof config.features).toBe('object');
      expect(typeof config.limits).toBe('object');

      // Check features structure
      expect(typeof config.features.analytics).toBe('boolean');
      expect(typeof config.features.teamCollaboration).toBe('boolean');
      expect(typeof config.features.customDomain).toBe('boolean');
      expect(typeof config.features.advancedSecurity).toBe('boolean');

      // Check limits structure
      expect(typeof config.limits.maxAgents).toBe('number');
      expect(typeof config.limits.maxConversations).toBe('number');
      expect(typeof config.limits.maxMemorySize).toBe('number');
      expect(typeof config.limits.apiRequestsPerMonth).toBe('number');
    });

    it('should not have additional properties', () => {
      const config = getDeploymentConfig();

      // Check that config only has expected properties
      expect(Object.keys(config)).toEqual(['mode', 'features', 'limits']);

      // Check that features only has expected properties
      expect(Object.keys(config.features)).toEqual([
        'analytics',
        'teamCollaboration',
        'customDomain',
        'advancedSecurity'
      ]);

      // Check that limits only has expected properties
      expect(Object.keys(config.limits)).toEqual([
        'maxAgents',
        'maxConversations',
        'maxMemorySize',
        'apiRequestsPerMonth'
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle feature checks with undefined gracefully', () => {
      // This test ensures the function is robust
      const config = getDeploymentConfig();

      // All features should be defined
      expect(config.features.analytics).toBeDefined();
      expect(config.features.teamCollaboration).toBeDefined();
      expect(config.features.customDomain).toBeDefined();
      expect(config.features.advancedSecurity).toBeDefined();
    });

    it('should handle limit checks with negative values', () => {
      expect(checkLimit('maxAgents', -1)).toBe(true);
      expect(checkLimit('maxConversations', -100)).toBe(true);
      expect(checkLimit('maxMemorySize', -999)).toBe(true);
      expect(checkLimit('apiRequestsPerMonth', -1000)).toBe(true);
    });

    it('should handle limit checks with zero values', () => {
      expect(checkLimit('maxAgents', 0)).toBe(true);
      expect(checkLimit('maxConversations', 0)).toBe(true);
      expect(checkLimit('maxMemorySize', 0)).toBe(true);
      expect(checkLimit('apiRequestsPerMonth', 0)).toBe(true);
    });
  });
});
