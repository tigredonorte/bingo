"use client";

import type { JSX } from "react";
import Link from "next/link";
import { useAuth, useSocialLogin } from "@repo/auth/hooks";
import { UserAvatar } from "@repo/ui/user-avatar";
import styles from "./auth-header.module.css";

export function AuthHeader(): JSX.Element {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { logout } = useSocialLogin();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Bingo
        </Link>

        <nav className={styles.nav}>
          {isLoading ? (
            <div className={styles.skeleton} />
          ) : isAuthenticated && user ? (
            <div className={styles.userSection}>
              <div className={styles.userInfo}>
                <UserAvatar src={user.image} name={user.name} size={36} />
                <span className={styles.userName}>{user.name}</span>
              </div>
              <button
                type="button"
                className={styles.signOutButton}
                onClick={() => logout("/")}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.signInButton}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
