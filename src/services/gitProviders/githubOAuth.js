import { setToken } from './tokenStore';

const STATE_KEY = 'insighttestai-github-oauth-state';

function createState() {
  const state = `${Math.random().toString(36).slice(2)}-${Date.now()}`;
  localStorage.setItem(STATE_KEY, state);
  return state;
}

function readState() {
  return localStorage.getItem(STATE_KEY);
}

function clearState() {
  localStorage.removeItem(STATE_KEY);
}

export function beginGitHubOAuth() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const backend = import.meta.env.VITE_OAUTH_BACKEND_URL; // for code exchange (server)
  if (!clientId || !backend) {
    // eslint-disable-next-line no-alert
    alert('Missing OAuth config. Please set VITE_GITHUB_CLIENT_ID and VITE_OAUTH_BACKEND_URL');
    return;
  }
  const redirectUri = `${window.location.origin}`; // return to root; modal will handle callback
  const state = createState();
  const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('repo read:user user:email')}&state=${encodeURIComponent(
    state
  )}`;
  window.location.assign(authorizeUrl);
}

// Global flag to prevent duplicate OAuth processing
let isGitHubOAuthProcessing = false;
let lastProcessedGitHubCode = null;

export async function tryHandleGitHubOAuthCallback() {
  console.log('=== GitHub OAuth Callback Handler ===');
  
  // Step 1: Extract OAuth parameters
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  console.log(`Frontend: OAuth callback - code: ${code ? 'PRESENT' : 'MISSING'}, state: ${state ? 'PRESENT' : 'MISSING'}`);
  
  if (!code || !state) {
    console.log('Frontend: Missing OAuth parameters, not handling');
    return { handled: false };
  }
  
  // Prevent duplicate processing
  if (isGitHubOAuthProcessing) {
    console.log('Frontend: GitHub OAuth already in progress, skipping...');
    return { handled: false };
  }
  
  if (lastProcessedGitHubCode === code) {
    console.log('Frontend: This GitHub OAuth code has already been processed, skipping...');
    return { handled: false };
  }
  
  // Set processing flag
  isGitHubOAuthProcessing = true;
  lastProcessedGitHubCode = code;
  
  try {
    // Step 2: Validate OAuth state
    const savedState = readState();
    console.log(`Frontend: State validation - saved: ${savedState ? 'PRESENT' : 'MISSING'}, matches: ${savedState === state}`);
    
    if (!savedState || savedState !== state) {
      console.error('Frontend: OAuth state mismatch - security violation');
      clearState();
      throw new Error('OAuth state mismatch - possible CSRF attack');
    }
    
    // Step 3: Clean URL immediately to prevent duplicate processing
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.toString());
    console.log('Frontend: URL cleaned immediately to prevent duplicate calls');
    
    console.log('Frontend: OAuth state validated, proceeding with flow...');
    
    // Step 4: Call backend API with OAuth code
    const backend = import.meta.env.VITE_OAUTH_BACKEND_URL;
    console.log(`Frontend: Backend URL: ${backend}`);
    
    const requestBody = { code };
    console.log('Frontend: Sending request to backend:', { code: '***', codeLength: code.length });
    
    const res = await fetch(`${backend.replace(/\/$/, '')}/api/github/repos/with-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`Frontend: Backend response status: ${res.status}`);
    
    // Step 5: Handle backend response
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Frontend: Backend API failed');
      console.error(`Frontend: Status: ${res.status}`);
      console.error(`Frontend: Error: ${errorText}`);
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(errorText);
        console.error('Frontend: Error details:', errorData);
      } catch (parseError) {
        console.error('Frontend: Could not parse error response');
      }
      
      throw new Error(`Backend API failed: ${res.status} - ${errorText}`);
    }
    
    // Step 6: Parse successful response
    const data = await res.json();
    console.log('Frontend: Backend response received successfully');
    console.log('Frontend: Response validation:', {
      success: data.success,
      hasUser: !!data.user,
      hasRepositories: !!data.repositories,
      hasAccessToken: !!data.access_token
    });
    
    // Step 7: Validate response structure
    if (!data.success || !data.access_token) {
      console.error('Frontend: Invalid response structure from backend');
      throw new Error('Invalid response from backend');
    }
    
    // Step 8: Store access token and clean up
    console.log('Frontend: Storing access token...');
    setToken('GitHub', data.access_token);
    clearState();
    console.log('Frontend: Access token stored and state cleared');
    
    // Step 9: Emit event for repos loaded
    if (data.repositories && data.repositories.length > 0) {
      console.log(`Frontend: Emitting github:repos-loaded event with ${data.repositories.length} repositories`);
      window.dispatchEvent(new CustomEvent('github:repos-loaded', { 
        detail: { 
          repos: data.repositories, 
          user: data.user 
        } 
      }));
    } else {
      console.log('Frontend: No repositories found, not emitting event');
    }
    
    console.log('Frontend: === GitHub OAuth Callback Completed Successfully ===');
    return { 
      handled: true, 
      repos: data.repositories, 
      user: data.user 
    };
    
  } catch (error) {
    console.error('Frontend: === GitHub OAuth Callback Failed ===');
    console.error('Frontend: Error type:', error.constructor.name);
    console.error('Frontend: Error message:', error.message);
    console.error('Frontend: Error stack:', error.stack);
    
    // Clean up on error
    clearState();
    console.log('Frontend: State cleared due to error');
    
    throw error;
  } finally {
    // Always reset processing flag
    isGitHubOAuthProcessing = false;
    console.log('Frontend: GitHub OAuth processing flag reset');
  }
}


