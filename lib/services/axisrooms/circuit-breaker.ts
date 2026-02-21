import { bookingLogs } from '@/lib/db/schema';
import { db } from '@/lib/db';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitConfig {
    failureThreshold: number; // e.g., 5 failures
    resetTimeoutMs: number;   // e.g., 60000ms (1 min)
}

export class CircuitBreaker {
    private state: CircuitState = 'CLOSED';
    private failureCount = 0;
    private lastFailureTime = 0;
    private config: CircuitConfig;
    private serviceName: string;

    constructor(serviceName: string, config: CircuitConfig = { failureThreshold: 5, resetTimeoutMs: 60000 }) {
        this.serviceName = serviceName;
        this.config = config;
    }

    async execute<T>(action: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.config.resetTimeoutMs) {
                this.transitionTo('HALF_OPEN');
            } else {
                throw new Error(`CircuitBreaker: Service ${this.serviceName} is OPEN. Fast failing.`);
            }
        }

        try {
            const result = await action();

            if (this.state === 'HALF_OPEN') {
                this.transitionTo('CLOSED');
            }
            // Success resets failure count in CLOSED state too? Usually yes.
            this.failureCount = 0;
            return result;
        } catch (error) {
            this.handleFailure(error);
            throw error;
        }
    }

    private handleFailure(error: any) {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        // Log failure
        console.error(`CircuitBreaker: ${this.serviceName} failed. Count: ${this.failureCount}`);

        if (this.state === 'CLOSED' && this.failureCount >= this.config.failureThreshold) {
            this.transitionTo('OPEN');
        } else if (this.state === 'HALF_OPEN') {
            this.transitionTo('OPEN');
        }
    }

    private transitionTo(newState: CircuitState) {
        console.log(`CircuitBreaker: ${this.serviceName} transitioning from ${this.state} to ${newState}`);
        this.state = newState;

        // Log transition to DB (fire and forget)
        db.insert(bookingLogs).values({
            action: 'circuit_breaker_transition',
            level: newState === 'OPEN' ? 'error' : 'info',
            errorMessage: `Circuit ${this.serviceName} changed to ${newState}`,
            requestPayload: { failureCount: this.failureCount }
        }).catch(err => console.error('Failed to log circuit transition', err));

        if (newState === 'CLOSED') {
            this.failureCount = 0;
        }
    }
}
