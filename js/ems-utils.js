/* ════════════════════════════════════════
   EMS Global Utility Object
   Provides common utilities for all pages
════════════════════════════════════════ */

window.EMS = {
    /**
     * Show toast notification
     */
    toast: function(message, type = 'success') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },

    /**
     * Fake API call with delay (for demo purposes)
     */
    fakeApi: function(data, delay = 500) {
        return new Promise(resolve => {
            setTimeout(() => resolve(data), delay);
        });
    },

    /**
     * Format date to locale string
     */
    formatDate: function(dateStr) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    },

    /**
     * Get token from localStorage
     */
    getToken: function() {
        return localStorage.getItem('token');
    },

    /**
     * Get current user from localStorage
     */
    getUser: function() {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: function() {
        return this.getToken() && this.getUser();
    },

    /**
     * Get authorization header
     */
    getAuthHeader: function() {
        const token = this.getToken();
        return token ? { 'Authorization': 'Bearer ' + token } : {};
    }
};
