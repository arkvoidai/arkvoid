import React from 'react';

// For simplicity in this step, we export simple placeholders for all routes
// In a real app we would have separate files for each, but this ensures they load successfully.

export { AdminAnalytics } from './pages/AdminAnalytics';
export { AdminUsers } from './pages/AdminUsers';
export { AdminUserDetail } from './pages/AdminUserDetail';
export const AdminSubscriptions = () => <div className="p-4"><h1 className="text-xl font-bold">Subscriptions</h1></div>;
export const AdminAgentsMonitor = () => <div className="p-4"><h1 className="text-xl font-bold">Agents Monitor</h1></div>;
export const AdminTraceAnalytics = () => <div className="p-4"><h1 className="text-xl font-bold">Trace Analytics</h1></div>;
export const AdminAPIUsage = () => <div className="p-4"><h1 className="text-xl font-bold">API Usage</h1></div>;
export { AdminRevenue } from './pages/AdminRevenue';
export { AdminBilling } from './pages/AdminBilling';
export { AdminLeads } from './pages/AdminLeads';
export { AdminDeployments } from './pages/AdminDeployments';
export { AdminErrorLogs } from './pages/AdminErrorLogs';
export { AdminFeatureFlags } from './pages/AdminFeatureFlags';
export { AdminUserLocations } from './pages/AdminUserLocations';
export { AdminRealTimeMonitor } from './pages/AdminRealTimeMonitor';
export const AdminSettings = () => <div className="p-4"><h1 className="text-xl font-bold">Settings</h1></div>;

export { AdminDashboard } from './pages/AdminDashboard';

