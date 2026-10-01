import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./app/router/router";
import { NoFoldPrivyProvider } from "./auth/NoFoldPrivyProvider";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <NoFoldPrivyProvider>
      <RouterProvider router={router} />
    </NoFoldPrivyProvider>
  </StrictMode>,
);
