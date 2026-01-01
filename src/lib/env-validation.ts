/**
 * Environment Variables Validation Script
 */

export function validateEnvironment() {
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'JWT_SECRET',
        'JWT_REFRESH_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        return false;
    }

    console.log('✅ All required environment variables are set');
    return true;
}

export function getEnvironmentInfo() {
    return {
        nodeEnv: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        jwtSecret: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
        redisUrl: process.env.REDIS_URL ? '✅ Set' : '⚠️ Optional',
        paymentGateway: process.env.PAYMENT_GATEWAY_KEY ? '✅ Set' : '⚠️ Optional'
    };
}
