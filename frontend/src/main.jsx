import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
              padding: "16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
            },
            success: {
              duration: 3000,
              style: {
                background: "#10b981",
              },
              iconTheme: {
                primary: "#fff",
                secondary: "#10b981",
              },
            },
            error: {
              duration: 4000,
              style: {
                background: "#ef4444",
              },
              iconTheme: {
                primary: "#fff",
                secondary: "#ef4444",
              },
            },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
