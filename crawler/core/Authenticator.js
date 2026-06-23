/**
 * Authenticator - Handles different authentication strategies
 */

import fs from 'fs-extra';
import { consoleLogger } from '../utils/logger.js';

export class Authenticator {
  constructor(authConfig) {
    this.config = authConfig || { strategy: 'none' };
    this.strategy = this.config.strategy || 'none';
    this.isAuthenticated = false;
  }

  /**
   * Main authentication method - delegates to strategy-specific methods
   */
  async authenticate(context, page) {
    if (this.strategy === 'none') {
      consoleLogger.info('No authentication required');
      return true;
    }

    consoleLogger.auth(`Authenticating using strategy: ${this.strategy}`);

    try {
      switch (this.strategy) {
        case 'form':
          return await this.authenticateForm(page);
        case 'session':
          return await this.authenticateSession(context);
        default:
          throw new Error(`Unknown authentication strategy: ${this.strategy}`);
      }
    } catch (error) {
      consoleLogger.error(`Authentication failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Form-based authentication
   */
  async authenticateForm(page) {
    const { loginUrl, credentials, selectors, successIndicator } = this.config;

    if (!loginUrl || !credentials || !credentials.username || !credentials.password) {
      throw new Error('Form authentication requires loginUrl and credentials');
    }

    consoleLogger.auth(`Navigating to login page: ${loginUrl}`);

    // Navigate to login page
    await page.goto(loginUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for form to load
    const usernameSelector = selectors?.username || 'input[name="username"], input#username, input[type="email"]';
    await page.waitForSelector(usernameSelector, { timeout: 10000 });

    consoleLogger.auth('Filling credentials...');

    // Fill username
    await page.fill(usernameSelector, credentials.username);

    // Fill password
    const passwordSelector = selectors?.password || 'input[name="password"], input#password, input[type="password"]';
    await page.fill(passwordSelector, credentials.password);

    // Submit form
    const submitSelector = selectors?.submit || 'button[type="submit"], input[type="submit"]';

    // Wait for navigation after submit
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }),
      page.click(submitSelector)
    ]);

    // Verify success
    const success = await this.verifySuccess(page, successIndicator);

    if (success) {
      this.isAuthenticated = true;
      consoleLogger.success('Authentication successful!');
    } else {
      throw new Error('Authentication failed - could not verify success');
    }

    return true;
  }

  /**
   * Session-based authentication (load saved cookies/storage)
   */
  async authenticateSession(context) {
    const { sessionFile } = this.config;

    if (!sessionFile) {
      throw new Error('Session authentication requires sessionFile path');
    }

    if (!await fs.pathExists(sessionFile)) {
      throw new Error(`Session file not found: ${sessionFile}`);
    }

    consoleLogger.auth(`Loading session from: ${sessionFile}`);

    // Session is loaded when creating the context with storageState
    // This method just verifies it was loaded
    this.isAuthenticated = true;
    consoleLogger.success('Session loaded successfully!');

    return true;
  }

  /**
   * Verify authentication was successful
   */
  async verifySuccess(page, indicator) {
    if (!indicator) {
      // No indicator specified, assume success if not on login page
      const currentUrl = page.url();
      return !currentUrl.includes('/login') && !currentUrl.includes('/signin');
    }

    // Check URL contains/not contains
    if (indicator.urlContains) {
      const currentUrl = page.url();
      const success = currentUrl.includes(indicator.urlContains);
      if (!success) {
        consoleLogger.warn(`URL does not contain "${indicator.urlContains}": ${currentUrl}`);
      }
      return success;
    }

    if (indicator.urlNotContains) {
      const currentUrl = page.url();
      const success = !currentUrl.includes(indicator.urlNotContains);
      if (!success) {
        consoleLogger.warn(`URL contains "${indicator.urlNotContains}": ${currentUrl}`);
      }
      return success;
    }

    // Check element exists
    if (indicator.elementExists) {
      try {
        await page.waitForSelector(indicator.elementExists, { timeout: 5000 });
        return true;
      } catch (error) {
        consoleLogger.warn(`Element not found: ${indicator.elementExists}`);
        return false;
      }
    }

    // Default: check URL doesn't contain login
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
  }

  /**
   * Save current session to file
   */
  async saveSession(context, filepath) {
    await context.storageState({ path: filepath });
    consoleLogger.success(`Session saved to: ${filepath}`);
  }

  /**
   * Check if authenticated
   */
  isAuth() {
    return this.isAuthenticated;
  }
}
