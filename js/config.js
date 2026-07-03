/* ════════════════════════════════════════
   Global Configuration
   Centralized API endpoints and constants
════════════════════════════════════════ */

// API Base URL - Change this single location for different environments
const API_BASE_URL = "https://employee-management-system-jt3h.onrender.com";

// API Endpoints
const API_ENDPOINTS = {
    auth: {
        login: `${API_BASE_URL}/api/auth/login`,
        register: `${API_BASE_URL}/api/auth/register`,
    },
    employees: `${API_BASE_URL}/api/employees`,
    departments: `${API_BASE_URL}/api/departments`,
    attendance: `${API_BASE_URL}/api/attendance`,
    leaves: `${API_BASE_URL}/api/leaves`,
    payroll: `${API_BASE_URL}/api/payroll`,
    profile: `${API_BASE_URL}/api/profile`,
    dashboard: {
        stats: `${API_BASE_URL}/api/dashboard/stats`,
        employeeStats: `${API_BASE_URL}/api/dashboard/employee`,
        departmentSummary: `${API_BASE_URL}/api/dashboard/department-summary`,
        recentEmployees: `${API_BASE_URL}/api/employees/recent`,
    }
};

// Helper function to get authorization header
function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': 'Bearer ' + token } : {};
}

// Helper function to make authenticated API calls
async function fetchAPI(url, options = {}) {
    const headers = {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
