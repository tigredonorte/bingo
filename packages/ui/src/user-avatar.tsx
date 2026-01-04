"use client";

import type { CSSProperties, JSX } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  onClick?: () => void;
}

/**
 * Generate initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.substring(0, 2).toUpperCase() ?? "";
  }
  return (
    (parts[0]?.charAt(0) ?? "") + (parts[parts.length - 1]?.charAt(0) ?? "")
  ).toUpperCase();
}

/**
 * Generate a consistent color based on name
 */
function getColorFromName(name: string): string {
  const colors = [
    "#f87171", "#fb923c", "#fbbf24", "#a3e635",
    "#34d399", "#22d3d8", "#60a5fa", "#a78bfa",
    "#f472b6", "#fb7185",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] ?? colors[0]!;
}

export function UserAvatar({ src, name, size = 40, onClick }: UserAvatarProps): JSX.Element {
  const containerStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: name ? getColorFromName(name) : "#6b7280",
    color: "#ffffff",
    fontSize: size * 0.4,
    fontWeight: 600,
    cursor: onClick ? "pointer" : "default",
    transition: "transform 0.1s ease",
  };

  const imageStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const handleClick = () => {
    onClick?.();
  };

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {src ? (
        <img src={src} alt={name ?? "User avatar"} style={imageStyle} />
      ) : (
        <span>{name ? getInitials(name) : "?"}</span>
      )}
    </div>
  );
}

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onSignOut: () => void;
}

export function UserMenu({ user, onSignOut }: UserMenuProps): JSX.Element {
  const menuStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    backgroundColor: "var(--background, #ffffff)",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  };

  const infoStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const nameStyle: CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--foreground, #1f1f1f)",
  };

  const emailStyle: CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
  };

  const signOutButtonStyle: CSSProperties = {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "1px solid #ef4444",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  return (
    <div style={menuStyle}>
      <UserAvatar src={user.image} name={user.name} size={40} />
      <div style={infoStyle}>
        <span style={nameStyle}>{user.name ?? "User"}</span>
        <span style={emailStyle}>{user.email}</span>
      </div>
      <button
        type="button"
        style={signOutButtonStyle}
        onClick={onSignOut}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#ef4444";
          e.currentTarget.style.color = "#ffffff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#ef4444";
        }}
      >
        Sign out
      </button>
    </div>
  );
}
