export class ENSService {
  private static ensCache: Map<string, string> = new Map();

  static async batchResolveAddresses(addresses: string[]): Promise<string[]> {
    try {
      // Filter out addresses that are already cached
      const uncachedAddresses = addresses.filter(
        (addr) => !this.ensCache.has(addr)
      );

      if (uncachedAddresses.length > 0) {
        const response = await fetch("/api/resolve-ens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ addresses: uncachedAddresses }),
        });

        if (!response.ok) {
          throw new Error("ENS resolution failed");
        }

        const { resolvedNames } = await response.json();

        // Update cache with new resolutions
        resolvedNames.forEach(
          ({ address, ensName }: { address: string; ensName: string }) => {
            this.ensCache.set(address, ensName);
          }
        );
      }

      // Return all resolved names (including cached ones)
      return addresses.map((addr) => this.ensCache.get(addr) || addr);
    } catch (error) {
      console.error("Error batch resolving ENS names:", error);
      return addresses;
    }
  }

  static async resolveAddress(address: string): Promise<string> {
    const [resolved] = await this.batchResolveAddresses([address]);
    return resolved;
  }
}
