/**
 * API utilities - retry logic, error handling, rate limiting
 */

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:54321/functions/v1';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff: 1s, 5s, 15s

/**
 * Make API call with retry logic
 */
export const apiCall = async (endpoint, options = {}, retryCount = 0) => {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log(`[API] Request to ${endpoint}:`, {
    method: options.method || 'GET',
    retryCount
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API] Success response from ${endpoint}`);
    return { data, error: null };

  } catch (error) {
    console.error(`[API] Error on ${endpoint}:`, error.message);

    // Retry logic for network errors and 5xx errors
    const isRetryableError =
      error.message.includes('NetworkError') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('HTTP 5');

    if (isRetryableError && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      console.warn(`[API] Retrying ${endpoint} in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return apiCall(endpoint, options, retryCount + 1);
    }

    // Max retries reached or non-retryable error
    return { data: null, error };
  }
};

/**
 * Upload file to API endpoint
 */
export const uploadFile = async (endpoint, file, onProgress = null) => {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log(`[API] Uploading file to ${endpoint}:`, {
    fileName: file.name,
    size: file.size,
    type: file.type
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    // Success handler
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log(`[API] File upload successful to ${endpoint}`);
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ data, error: null });
        } catch (e) {
          resolve({ data: { success: true }, error: null });
        }
      } else {
        console.error(`[API] File upload failed to ${endpoint}:`, xhr.statusText);
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    // Error handler
    xhr.addEventListener('error', () => {
      console.error(`[API] Network error during file upload to ${endpoint}`);
      reject(new Error('Network error during upload'));
    });

    // Abort handler
    xhr.addEventListener('abort', () => {
      console.warn(`[API] File upload aborted to ${endpoint}`);
      reject(new Error('Upload aborted'));
    });

    // Send request
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', url);
    xhr.send(formData);
  });
};

/**
 * Handle API errors with user-friendly messages
 */
export const handleApiError = (error) => {
  console.error('[API] Handling error:', error);

  if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  if (error.message.includes('HTTP 401')) {
    return 'Authentication error. Please sign in again.';
  }

  if (error.message.includes('HTTP 403')) {
    return 'Permission denied. You do not have access to this resource.';
  }

  if (error.message.includes('HTTP 404')) {
    return 'Resource not found. Please try again.';
  }

  if (error.message.includes('HTTP 429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (error.message.includes('HTTP 5')) {
    return 'Server error. Our team has been notified. Please try again later.';
  }

  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Check API health
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('[API] Health check failed:', error);
    return false;
  }
};
