export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    timeout: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    timeout: 10000, // 10 seconds
};

export class RetryManager {
    private config: RetryConfig;

    constructor(config?: Partial<RetryConfig>) {
        this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    }

    async execute<T>(operation: () => Promise<T>, context: string): Promise<T> {
        let attempt = 0;
        let lastError: any;

        while (attempt <= this.config.maxRetries) {
            try {
                // Create a timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Operation timed out after ${this.config.timeout}ms`));
                    }, this.config.timeout);
                });

                // Race execution against timeout
                const result = await Promise.race([operation(), timeoutPromise]);
                return result;
            } catch (error: any) {
                lastError = error;
                attempt++;

                if (attempt > this.config.maxRetries) {
                    break;
                }

                // Determine if retryable
                if (!this.isRetryable(error)) {
                    throw error;
                }

                // Calculate backoff
                const delay = Math.min(
                    this.config.baseDelay * Math.pow(2, attempt - 1),
                    this.config.maxDelay
                );

                console.warn(`[RetryManager] ${context} failed (Attempt ${attempt}/${this.config.maxRetries}). Retrying in ${delay}ms... Error: ${error.message}`);
                await this.delay(delay);
            }
        }

        throw new Error(`[RetryManager] ${context} failed after ${this.config.maxRetries} attempts. Last error: ${lastError?.message}`);
    }

    private isRetryable(error: any): boolean {
        // Retry on network errors, 5xx server errors, or timeouts
        if (error.message && error.message.includes('timed out')) return true;
        if (error.code && ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'].includes(error.code)) return true;

        // Check for HTTP status codes if available (e.g. from axios/fetch response)
        if (error.response && error.response.status) {
            const status = error.response.status;
            return status >= 500 || status === 429;
        }

        return false;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
