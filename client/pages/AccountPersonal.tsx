import React from "react";
import { Navigate } from "react-router-dom";

// Redirect component for legacy /account/personal route
export default function AccountPersonal() {
  return <Navigate to="/account/personal" replace />;
}
