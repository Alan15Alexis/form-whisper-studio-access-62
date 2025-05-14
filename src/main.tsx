
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { FormProvider } from './contexts/form'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './hooks/use-toast.tsx'
import { Toaster } from './components/ui/toaster.tsx'

// Create a client for react-query
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FormProvider>
            <ToastProvider>
              <App />
              <Toaster />
            </ToastProvider>
          </FormProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
