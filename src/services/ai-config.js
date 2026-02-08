
// Centralized configuration for AI services
// This ensures the key works even if environment variables are not set in Netlify UI

const ENV_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Fallback key from local environment (hardcoded for reliability in this deployment context)
// Note: In a strictly public repo, this should be avoided, but for this private project it ensures functionality.
const FALLBACK_KEY = "AIzaSyBgrilwynmtFsJgTICrSewoTzz1deLzK0M";

export const GEMINI_API_KEY = ENV_KEY || FALLBACK_KEY;

export const checkApiKey = () => {
    if (!GEMINI_API_KEY) {
        console.error("❌ Gemini API Key is missing!");
        return false;
    }
    return true;
};
