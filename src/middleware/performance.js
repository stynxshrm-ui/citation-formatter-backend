const { logger } = require('../utils/logger');

// Performance metrics storage
const metrics = {
  requestCount: 0,
  totalResponseTime: 0,
  apiCalls: {
    crossref: { count: 0, totalTime: 0, errors: 0 },
    semanticScholar: { count: 0, totalTime: 0, errors: 0 }
  },
  startTime: Date.now()
};

// Performance monitoring middleware
function performanceMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Update metrics
    metrics.requestCount++;
    metrics.totalResponseTime += responseTime;
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }
    
    // Call original end
    originalEnd.apply(this, args);
  };
  
  next();
}

// Track API calls
function trackAPICall(apiName, startTime, success) {
  const responseTime = Date.now() - startTime;
  
  if (metrics.apiCalls[apiName]) {
    metrics.apiCalls[apiName].count++;
    metrics.apiCalls[apiName].totalTime += responseTime;
    if (!success) {
      metrics.apiCalls[apiName].errors++;
    }
  }
}

// Get performance metrics
function getMetrics() {
  const uptime = Date.now() - metrics.startTime;
  const avgResponseTime = metrics.requestCount > 0 ? metrics.totalResponseTime / metrics.requestCount : 0;
  
  const apiMetrics = {};
  for (const [apiName, data] of Object.entries(metrics.apiCalls)) {
    apiMetrics[apiName] = {
      count: data.count,
      avgResponseTime: data.count > 0 ? data.totalTime / data.count : 0,
      errorRate: data.count > 0 ? (data.errors / data.count) * 100 : 0
    };
  }
  
  return {
    uptime,
    requestCount: metrics.requestCount,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    apiCalls: apiMetrics,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
    }
  };
}

// Reset metrics (for testing)
function resetMetrics() {
  metrics.requestCount = 0;
  metrics.totalResponseTime = 0;
  metrics.apiCalls = {
    crossref: { count: 0, totalTime: 0, errors: 0 },
    semanticScholar: { count: 0, totalTime: 0, errors: 0 }
  };
  metrics.startTime = Date.now();
}

module.exports = {
  performanceMiddleware,
  trackAPICall,
  getMetrics,
  resetMetrics
};
