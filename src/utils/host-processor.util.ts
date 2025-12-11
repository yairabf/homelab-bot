/**
 * Utility for processing hostnames, particularly for DNS wizard
 * that requires .yairlab suffix
 */
export class HostProcessor {
  /**
   * Adds .yairlab suffix to hostname for DNS services if not already present
   * @param host - The hostname to process
   * @param serviceType - The service type (e.g., 'dns', 'dashboard')
   * @returns Processed hostname with .yairlab suffix for DNS, original for others
   */
  static addYairlabSuffixIfNeeded(
    host: string,
    serviceType: string,
  ): string {
    if (serviceType !== 'dns') {
      return host;
    }

    // Remove any existing .yairlab suffix to avoid duplication
    const cleanedHost = host.replace(/\.yairlab$/, '');

    // Basic validation: hostname should contain only valid characters
    if (!/^[a-z0-9.-]+$/i.test(cleanedHost)) {
      throw new Error(
        'Invalid hostname format. Only letters, numbers, dots, and hyphens are allowed.',
      );
    }

    return `${cleanedHost}.yairlab`;
  }

  /**
   * Validates hostname format
   * @param host - The hostname to validate
   * @returns true if valid, false otherwise
   */
  static isValidHostname(host: string): boolean {
    if (!host || host.trim() === '') {
      return false;
    }

    // Basic hostname validation: alphanumeric, dots, hyphens
    return /^[a-z0-9.-]+$/i.test(host);
  }
}

