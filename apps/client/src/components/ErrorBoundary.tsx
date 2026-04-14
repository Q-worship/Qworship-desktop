import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global Error Boundary — catches unhandled React render errors and prevents
 * the entire app from crashing to a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "#0f0a1e",
            color: "#e2e8f0",
            fontFamily:
              'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              padding: "2.5rem",
              borderRadius: "1rem",
              background: "linear-gradient(145deg, #1a0f2e, #130b22)",
              border: "1px solid rgba(131, 86, 243, 0.3)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚡</div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "0.75rem",
                background: "linear-gradient(135deg, #8356F3, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              An unexpected error occurred. You can try dismissing the error or
              reloading the application.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  fontSize: "0.75rem",
                  color: "#f87171",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: "120px",
                  marginBottom: "1.5rem",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={this.handleDismiss}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(131, 86, 243, 0.4)",
                  background: "transparent",
                  color: "#a78bfa",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.background =
                    "rgba(131, 86, 243, 0.15)";
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.background = "transparent";
                }}
              >
                Dismiss
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  background: "linear-gradient(135deg, #8356F3, #6d3de0)",
                  color: "white",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.opacity = "0.9";
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.opacity = "1";
                }}
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
