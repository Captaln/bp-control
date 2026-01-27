import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Lazy load Admin to keep main bundle small
const AdminApp = React.lazy(() => import('./src/admin/AdminApp'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple Router
const path = window.location.pathname;

if (path.startsWith('/admin')) {
  root.render(
    <React.StrictMode>
      <Suspense fallback={<div className="bg-slate-950 h-screen w-screen text-white flex items-center justify-center">Loading Command Center...</div>}>
        <AdminApp />
      </Suspense>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}