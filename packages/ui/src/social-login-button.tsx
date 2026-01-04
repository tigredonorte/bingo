"use client";

import type { ReactNode, ButtonHTMLAttributes, JSX } from "react";

export type SocialProvider = "google" | "facebook" | "apple";

interface SocialLoginButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  provider: SocialProvider;
  onClick?: () => void;
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * SVG Icons for social providers
 */
const GoogleIcon = (): JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = (): JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z"
      fill="#1877F2"
    />
  </svg>
);

const AppleIcon = (): JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const LoadingSpinner = (): JSX.Element => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const providerConfig: Record<SocialProvider, { label: string; Icon: () => JSX.Element; bgColor: string; textColor: string; hoverBgColor: string }> = {
  google: {
    label: "Continue with Google",
    Icon: GoogleIcon,
    bgColor: "#ffffff",
    textColor: "#1f1f1f",
    hoverBgColor: "#f5f5f5",
  },
  facebook: {
    label: "Continue with Facebook",
    Icon: FacebookIcon,
    bgColor: "#1877F2",
    textColor: "#ffffff",
    hoverBgColor: "#166fe5",
  },
  apple: {
    label: "Continue with Apple",
    Icon: AppleIcon,
    bgColor: "#000000",
    textColor: "#ffffff",
    hoverBgColor: "#1a1a1a",
  },
};

export function SocialLoginButton({
  provider,
  onClick,
  isLoading = false,
  fullWidth = true,
  disabled,
  style,
  ...props
}: SocialLoginButtonProps): JSX.Element {
  const config = providerConfig[provider];

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 500,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    border: provider === "google" ? "1px solid #dadce0" : "none",
    borderRadius: "8px",
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    width: fullWidth ? "100%" : "auto",
    minHeight: "48px",
    backgroundColor: config.bgColor,
    color: config.textColor,
    opacity: disabled || isLoading ? 0.7 : 1,
    ...style,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.backgroundColor = config.hoverBgColor;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = config.bgColor;
      }}
      onMouseDown={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = "scale(0.98)";
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      {...props}
    >
      {isLoading ? <LoadingSpinner /> : <config.Icon />}
      <span>{isLoading ? "Signing in..." : config.label}</span>
    </button>
  );
}

/**
 * Container for social login buttons with divider
 */
interface SocialLoginContainerProps {
  children: ReactNode;
  title?: string;
  showDivider?: boolean;
  dividerText?: string;
}

export function SocialLoginContainer({
  children,
  title = "Sign in to continue",
  showDivider = false,
  dividerText = "or",
}: SocialLoginContainerProps): JSX.Element {
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
    maxWidth: "400px",
    padding: "32px",
    backgroundColor: "var(--background, #ffffff)",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 600,
    textAlign: "center",
    marginBottom: "8px",
    color: "var(--foreground, #1f1f1f)",
  };

  const dividerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    color: "#6b7280",
    fontSize: "14px",
  };

  const lineStyle: React.CSSProperties = {
    flex: 1,
    height: "1px",
    backgroundColor: "#e5e7eb",
  };

  return (
    <div style={containerStyle}>
      {title && <h2 style={titleStyle}>{title}</h2>}
      {children}
      {showDivider && (
        <div style={dividerStyle}>
          <div style={lineStyle} />
          <span>{dividerText}</span>
          <div style={lineStyle} />
        </div>
      )}
    </div>
  );
}
