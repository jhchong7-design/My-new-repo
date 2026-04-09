/* ============================================
   Bible Glocal — API Configuration
   ============================================
   
   This config detects the deployment environment:
   - If running on the Node.js server (port 3000), API calls go to same origin
   - If running on static deployment (S3/sites.super.myninja.ai), 
     it uses the configured API server URL
   
   To configure for production:
   Set BG_CONFIG.API_SERVER to your actual server URL
   e.g., 'https://your-server.com'
   ============================================ */

const BG_CONFIG = (() => {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // Detect if running on static deployment (no backend available)
  const isStaticDeploy = hostname.includes('sites.super.myninja.ai') || 
                          hostname.includes('s3.') ||
                          hostname.includes('cloudfront.net');
  
  // Configure API server URL
  // For production: replace with your actual server URL (e.g., 'https://bibleglocal.org')
  // For development/sandbox: uses same origin (Node.js server on port 3000)
  const API_SERVER = isStaticDeploy ? '' : origin;
  
  return {
    API_SERVER,
    API_BASE: API_SERVER ? API_SERVER + '/api' : '/api',
    isStaticDeploy,
    
    // Helper: get full API URL
    apiUrl(path) {
      if (API_SERVER) {
        return API_SERVER + path;
      }
      return path;
    }
  };
})();