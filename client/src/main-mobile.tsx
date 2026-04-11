import React from "react";
import { createRoot } from "react-dom/client";
import UserAppMobile from "./AppMobile";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserAppMobile />
  </React.StrictMode>
);