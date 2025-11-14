/**
 * Analytics utility for tracking page views
 * Sends events to Cloudflare Worker API
 */

// Get or create a unique user identifier
function getUserHash() {
  const STORAGE_KEY = 'pg_user_id'
  
  // Try to get existing ID from localStorage
  let userId = localStorage.getItem(STORAGE_KEY)
  
  // If no ID exists, create one
  if (!userId) {
    // Generate a simple unique ID (timestamp + random)
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(STORAGE_KEY, userId)
  }
  
  // Hash the user ID for privacy (simple hash function)
  // In production, you might want a more robust hashing function
  return simpleHash(userId)
}

// Simple hash function (for privacy)
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// Get the analytics API endpoint from environment variable
// IMPORTANT: Never hardcode the endpoint URL in source code
// Set VITE_ANALYTICS_ENDPOINT in your .env file or build environment
function getAnalyticsEndpoint() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT
  
  if (!endpoint) {
    console.warn('Analytics: VITE_ANALYTICS_ENDPOINT not set. Analytics will be disabled.')
    return null
  }
  
  return endpoint
}

/**
 * Check if enough time has passed since last page view (rate limiting)
 * Prevents spam from rapid page refreshes
 */
function shouldTrackPageView() {
  const RATE_LIMIT_KEY = 'pg_last_pageview'
  const RATE_LIMIT_MS = 60000 // 1 minute between page views
  
  const lastPageView = localStorage.getItem(RATE_LIMIT_KEY)
  const now = Date.now()
  
  if (!lastPageView) {
    localStorage.setItem(RATE_LIMIT_KEY, now.toString())
    return true
  }
  
  const timeSinceLastView = now - parseInt(lastPageView, 10)
  
  if (timeSinceLastView >= RATE_LIMIT_MS) {
    localStorage.setItem(RATE_LIMIT_KEY, now.toString())
    return true
  }
  
  // Too soon since last page view
  return false
}

/**
 * Track a page view event
 * This function is safe to call multiple times - it won't break if the API fails
 * Includes rate limiting to prevent spam from rapid refreshes
 */
export async function trackPageView() {
  // Rate limiting: only track if at least 1 minute has passed since last page view
  if (!shouldTrackPageView()) {
    return
  }
  
  const endpoint = getAnalyticsEndpoint()
  
  // Skip if endpoint is not configured
  if (!endpoint) {
    return
  }
  
  try {
    const userHash = getUserHash()
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'page_view',
        user_hash: userHash,
      }),
    })
    
    if (!response.ok) {
      console.warn('Analytics: Failed to track page view', response.status)
    }
    
    // Silently fail - don't throw errors that could break the app
  } catch (error) {
    // Silently fail - analytics should never break the user experience
    console.warn('Analytics: Error tracking page view', error)
  }
}

