/**
 * Load Testing Simulator for DEORA System
 */

export interface LoadTestScenario {
    name: string;
    concurrentUsers: number;
    requestsPerSecond: number;
    duration: number; // in seconds
    endpoints: string[];
}

export interface LoadTestResult {
    scenario: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
}

export class LoadTester {
    static async simulateLoad(scenario: LoadTestScenario): Promise<LoadTestResult> {
        const totalRequests = scenario.requestsPerSecond * scenario.duration;
        const successRate = 0.95; // 95% success rate simulation
        const successfulRequests = Math.floor(totalRequests * successRate);
        const failedRequests = totalRequests - successfulRequests;
        
        // Simulate response times (in milliseconds)
        const averageResponseTime = Math.random() * 200 + 100; // 100-300ms
        const maxResponseTime = averageResponseTime * 3;
        
        return {
            scenario: scenario.name,
            totalRequests,
            successfulRequests,
            failedRequests,
            averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
            maxResponseTime: parseFloat(maxResponseTime.toFixed(2)),
            requestsPerSecond: scenario.requestsPerSecond,
            errorRate: parseFloat(((failedRequests / totalRequests) * 100).toFixed(2))
        };
    }

    static getLoadTestScenarios(): LoadTestScenario[] {
        return [
            {
                name: "Normal Business Hours",
                concurrentUsers: 50,
                requestsPerSecond: 10,
                duration: 60,
                endpoints: ["/api/orders", "/api/menu", "/api/customers"]
            },
            {
                name: "Peak Dinner Rush",
                concurrentUsers: 200,
                requestsPerSecond: 50,
                duration: 120,
                endpoints: ["/api/orders", "/api/billing", "/api/kitchen"]
            },
            {
                name: "Weekend Event Load",
                concurrentUsers: 500,
                requestsPerSecond: 100,
                duration: 180,
                endpoints: ["/api/bookings", "/api/events", "/api/catering"]
            },
            {
                name: "System Stress Test",
                concurrentUsers: 1000,
                requestsPerSecond: 200,
                duration: 300,
                endpoints: ["/api/orders", "/api/billing", "/api/inventory", "/api/reports"]
            }
        ];
    }

    static async runLoadTests(): Promise<LoadTestResult[]> {
        const scenarios = this.getLoadTestScenarios();
        const results: LoadTestResult[] = [];

        for (const scenario of scenarios) {
            const result = await this.simulateLoad(scenario);
            results.push(result);
        }

        return results;
    }
}
