// BG_CONFIG — Environment detection for static deploy vs server
const BG_CONFIG = (() => {
  const hostname = window.location.hostname;
  const origin = window.location.origin;
  const isStaticDeploy = hostname.includes('sites.super.myninja.ai') ||
                          hostname.includes('s3.') ||
                          hostname.includes('cloudfront.net') ||
                          hostname.includes('.s3-website');
  const API_SERVER = isStaticDeploy ? '' : origin;
  return {
    API_SERVER,
    API_BASE: API_SERVER ? API_SERVER + '/api' : '/api',
    isStaticDeploy,
    apiUrl(path) {
      if (API_SERVER) return API_SERVER + path;
      return path;
    }
  };
})();