import { CommandExecutor } from '../interfaces/CommandExecutor';
import { NotFoundException } from '../utils/errors';
import { Logger } from '../utils/Logger';

const logger = Logger.create('ExecutorFactory');

export interface ExecutorWithVersion {
  executor: CommandExecutor;
  version: number;
}

export class ExecutorFactory {
  // List of all registered versions (sorted descending for efficient latest-first lookup)
  private static versions: number[] = [];

  // Map: version -> Map<actionName, executor>
  private static registry: Map<number, Map<string, CommandExecutor>> =
    new Map();

  /**
   * Register an executor for a specific version
   */
  public static register(
    actionName: string,
    executor: CommandExecutor,
    version: number = 1
  ): void {
    // Add version to list if not exists (will be sorted later by sortVersions)
    if (!this.versions.includes(version)) {
      this.versions.push(version);
    }

    // Get or create the action map for this version
    if (!this.registry.has(version)) {
      this.registry.set(version, new Map());
    }

    const actionMap = this.registry.get(version)!;
    actionMap.set(actionName, executor);

    logger.info(`Registered executor for: ${actionName} (v${version})`);
  }

  /**
   * Sort versions in descending order
   * Should be called after all executors are registered
   */
  public static sortVersions(): void {
    this.versions.sort((a, b) => b - a); // Sort descending for efficient lookup
    logger.info(`Versions sorted: [${this.versions.join(', ')}]`);
  }

  /**
   * Get executor for the latest version (used for executeCommand)
   */
  public static getExecutor(actionName: string): ExecutorWithVersion {
    if (this.versions.length === 0) {
      throw new NotFoundException(`No executors registered`);
    }

    // Get the latest version (first in descending sorted list)
    const latestVersion = this.versions[0];

    // Lookup executor in latest version
    const actionMap = this.registry.get(latestVersion);
    if (actionMap?.has(actionName)) {
      return { executor: actionMap.get(actionName)!, version: latestVersion };
    }

    throw new NotFoundException(
      `Unknown action: ${actionName}. Did you forget to register it?`
    );
  }

  /**
   * Get executor for a specific version (used for applyChange when replaying)
   */
  public static getVersionedExecutor(
    targetVersion: number,
    actionName: string
  ): ExecutorWithVersion {
    if (this.versions.length === 0) {
      throw new NotFoundException(`No executors registered`);
    }

    const actionMap = this.registry.get(targetVersion);
    if (actionMap?.has(actionName)) {
      return { executor: actionMap.get(actionName)!, version: targetVersion };
    }

    throw new NotFoundException(
      `No executor found for action: ${actionName} at or before version: ${targetVersion}`
    );
  }

  /**
   * Get all registered versions
   */
  public static getRegisteredVersions(): number[] {
    return [...this.versions]; // Return copy
  }
}
