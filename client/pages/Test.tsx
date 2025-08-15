import React from "react";

export default function Test() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "white", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ 
          fontSize: "48px", 
          color: "#003580", 
          marginBottom: "16px",
          fontWeight: "bold"
        }}>
          ✅ React UI Working!
        </h1>
        <p style={{ 
          fontSize: "20px", 
          color: "#666", 
          marginBottom: "32px" 
        }}>
          Faredown is loading correctly
        </p>
        <div style={{ 
          backgroundColor: "#003580", 
          color: "white", 
          padding: "12px 24px", 
          borderRadius: "8px",
          display: "inline-block"
        }}>
          UI Render Test: PASSED
        </div>
        <div style={{ marginTop: "32px" }}>
          <a 
            href="/admin/login" 
            style={{ 
              backgroundColor: "#febb02", 
              color: "#003580", 
              padding: "8px 16px", 
              borderRadius: "4px", 
              textDecoration: "none", 
              fontWeight: "bold",
              marginRight: "16px"
            }}
          >
            Admin Panel
          </a>
          <a 
            href="/admin/api" 
            style={{ 
              backgroundColor: "#28a745", 
              color: "white", 
              padding: "8px 16px", 
              borderRadius: "4px", 
              textDecoration: "none", 
              fontWeight: "bold"
            }}
          >
            API Testing
          </a>
        </div>
      </div>
    </div>
  );
}
