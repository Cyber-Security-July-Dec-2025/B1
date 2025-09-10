import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './router.jsx'
import { RouterProvider } from 'react-router-dom'
// import {Toaster} from "@/components/ui/toaster";
import { Provider } from 'react-redux';
// import { store } from './store';
createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router} />
      {/* <Toaster /> */}
  </StrictMode>,
)