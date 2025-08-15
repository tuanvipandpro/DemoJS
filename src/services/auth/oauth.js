export function getGitHubRedirectUri() {
  return import.meta.env.VITE_GITHUB_REDIRECT_URI || window.location.origin;
}

export function redirectToGitHubOAuth(stateObj) {
  // Pure frontend OAuth: redirect user to GitHub authorize page
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  if (!clientId) throw new Error('Missing VITE_GITHUB_CLIENT_ID');
  const redirectUri = getGitHubRedirectUri();
  const state = stateObj ? btoa(JSON.stringify(stateObj)) : '';
  const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('repo read:user user:email')}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
  window.location.assign(authorizeUrl);
}

// Updated checkOAuthReturn function to handle repos API response
export async function checkOAuthReturn() {
  const params = new URLSearchParams(window.location.search);
  const connected = params.get('connected');
  const stateParam = params.get('state');
  const code = params.get('code');
  
  console.log('=== Frontend: Checking OAuth return ===');
  console.log(`Frontend: URL params - connected: ${connected}, state: ${stateParam ? 'PRESENT' : 'MISSING'}, code: ${code ? 'PRESENT' : 'MISSING'}`);
  
  let decodedState = null;
  if (stateParam) {
    try {
      decodedState = JSON.parse(atob(stateParam));
    } catch (_e) {
      decodedState = null;
    }
  }
  
  // If we have a code, exchange it for repos and access token
  if (code) {
    console.log('Frontend: OAuth code found, starting exchange...');
    
    // Clean URL immediately to prevent duplicate processing
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.toString());
    console.log('Frontend: URL cleaned immediately to prevent duplicate calls');
    
    // Exchange code for repos and access token
    const reposData = await exchangeGitHubCode(code);
    
    // If we got repos data, we can trigger project creation
    if (reposData && reposData.repositories) {
      console.log('Frontend: GitHub repos loaded, ready for project creation');
      window.dispatchEvent(new CustomEvent('github:repos-loaded', {
        detail: { repos: reposData.repositories, user: reposData.user }
      }));
    }
  }
  
  // Clean any remaining URL parameters
  const finalUrl = new URL(window.location.href);
  finalUrl.searchParams.delete('connected');
  finalUrl.searchParams.delete('state');
  finalUrl.searchParams.delete('code');
  window.history.replaceState({}, document.title, finalUrl.toString());
  
  return { connected: !!connected, provider: connected, state: decodedState, code: null };
}

// Global flag to prevent multiple API calls with the same code
let isProcessingOAuth = false;
let lastProcessedCode = null;

// Updated exchangeGitHubCode function to prevent duplicate calls
async function exchangeGitHubCode(code) {
  try {
    console.log('=== Frontend: Starting GitHub OAuth Flow ===');
    console.log(`Frontend: OAuth code received: ${code.substring(0, 10)}...`);
    
    // Prevent duplicate processing
    if (isProcessingOAuth) {
      console.log('Frontend: OAuth flow already in progress, skipping...');
      return null;
    }
    
    if (lastProcessedCode === code) {
      console.log('Frontend: This OAuth code has already been processed, skipping...');
      return null;
    }
    
    // Set processing flag
    isProcessingOAuth = true;
    lastProcessedCode = code;
    
    console.log('Frontend: Starting OAuth processing...');
    
    const backend = import.meta.env.VITE_OAUTH_BACKEND_URL || 'http://localhost:3001';
    console.log(`Frontend: Backend URL: ${backend}`);
    
    // Step 1: Send OAuth code to backend
    console.log('Frontend: Step 1 - Sending OAuth code to backend...');
    const requestBody = { code };
    console.log('Frontend: Request body:', { code: '***', codeLength: code.length });
    
    const res = await fetch(`${backend.replace(/\/$/, '')}/api/github/repos/with-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`Frontend: Backend response status: ${res.status}`);
    
    // Step 2: Handle response
    if (!res.ok) {
      console.error('Frontend: Backend API failed');
      console.error(`Frontend: Status: ${res.status}`);
      
      const errorText = await res.text();
      console.error(`Frontend: Error response: ${errorText}`);
      
      // Try to parse error as JSON
      try {
        const errorData = JSON.parse(errorText);
        console.error('Frontend: Parsed error:', errorData);
        
        // Handle specific error types
        if (errorData.error === 'missing_code') {
          console.error('Frontend: OAuth code is missing');
        } else if (errorData.error === 'token_exchange_failed') {
          console.error('Frontend: GitHub token exchange failed');
        } else if (errorData.error === 'no_access_token') {
          console.error('Frontend: No access token received from GitHub');
        } else if (errorData.error === 'oauth_flow_failed') {
          console.error('Frontend: OAuth flow failed:', errorData.details);
        }
      } catch (parseError) {
        console.error('Frontend: Could not parse error response');
      }
      return null;
    }
    
    // Step 3: Parse successful response
    console.log('Frontend: Step 2 - Parsing successful response...');
    const data = await res.json();
    console.log('Frontend: Response received successfully');
    console.log('Frontend: Response structure:', {
      success: data.success,
      hasUser: !!data.user,
      hasRepositories: !!data.repositories,
      hasAccessToken: !!data.access_token,
      userLogin: data.user?.login,
      repoCount: data.repositories?.length
    });
    
    // Step 4: Validate response
    if (!data.success || !data.access_token) {
      console.error('Frontend: Invalid response from backend');
      console.error('Frontend: Response data:', data);
      return null;
    }
    
    // Step 5: Store access token
    console.log('Frontend: Step 3 - Storing access token...');
    const { setToken } = await import('../gitProviders/tokenStore.js');
    setToken('GitHub', data.access_token);
    console.log('Frontend: Access token stored successfully');
    
    // Step 6: Return data for further processing
    console.log('Frontend: === GitHub OAuth Flow Completed Successfully ===');
    return data;
    
  } catch (error) {
    console.error('Frontend: === GitHub OAuth Flow Failed ===');
    console.error('Frontend: Error type:', error.constructor.name);
    console.error('Frontend: Error message:', error.message);
    console.error('Frontend: Error stack:', error.stack);
    return null;
  } finally {
    // Always reset processing flag
    isProcessingOAuth = false;
    console.log('Frontend: OAuth processing flag reset');
  }
}

export function clearOAuthQueryParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('connected');
  window.history.replaceState({}, document.title, url.toString());
}


