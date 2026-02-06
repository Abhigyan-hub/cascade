import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#12121a',
          color: '#fff',
          border: '1px solid #2a2a3a',
        },
      }}
    />
  </React.StrictMode>
)
