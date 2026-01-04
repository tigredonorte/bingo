"use client";

import type { JSX } from "react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SocialLoginButton, SocialLoginContainer } from "@repo/ui/social-login-button";
import { useAuth, useSocialLogin, useDeviceDetection } from "@repo/auth/hooks";
import styles from "./page.module.css";

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: sessionLoading } = useAuth();
  const { loginWithGoogle, loginWithFacebook, loginWithApple, isLoading, error, clearError } = useSocialLogin();
  const { isAppleDevice, isHydrated } = useDeviceDetection();

  // Get callback URL from query params or default to home
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, callbackUrl, router]);

  // Get error from URL if redirected from auth error
  const urlError = searchParams.get("error");
  const errorMessage = error ?? (urlError ? getErrorMessage(urlError) : null);

  // Show loading state while checking session
  if (sessionLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <SocialLoginContainer title="Welcome back" showDivider={false}>
        <p className={styles.subtitle}>Sign in to continue to your account</p>

        {errorMessage && (
          <div className={styles.errorBox} onClick={clearError}>
            <span>{errorMessage}</span>
            <button type="button" className={styles.errorClose}>×</button>
          </div>
        )}

        <div className={styles.buttonGroup}>
          <SocialLoginButton
            provider="google"
            onClick={() => loginWithGoogle(callbackUrl)}
            isLoading={isLoading === "google"}
            disabled={isLoading !== null && isLoading !== "google"}
          />

          <SocialLoginButton
            provider="facebook"
            onClick={() => loginWithFacebook(callbackUrl)}
            isLoading={isLoading === "facebook"}
            disabled={isLoading !== null && isLoading !== "facebook"}
          />

          {/* Show Apple Sign-In only on Apple devices (or when not yet hydrated to avoid layout shift) */}
          {(!isHydrated || isAppleDevice) && (
            <SocialLoginButton
              provider="apple"
              onClick={() => loginWithApple(callbackUrl)}
              isLoading={isLoading === "apple"}
              disabled={isLoading !== null && isLoading !== "apple"}
            />
          )}
        </div>

        <p className={styles.terms}>
          By continuing, you agree to our{" "}
          <a href="/terms" className={styles.link}>Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" className={styles.link}>Privacy Policy</a>
        </p>
      </SocialLoginContainer>
    </div>
  );
}

/**
 * Map NextAuth error codes to user-friendly messages
 */
function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "Access denied. You may not have permission to sign in.",
    Verification: "The verification link has expired or has already been used.",
    OAuthSignin: "Could not start the sign-in process. Please try again.",
    OAuthCallback: "Could not complete the sign-in process. Please try again.",
    OAuthCreateAccount: "Could not create your account. Please try again.",
    EmailCreateAccount: "Could not create your account. Please try again.",
    Callback: "Could not complete the sign-in. Please try again.",
    OAuthAccountNotLinked: "This email is already associated with another account.",
    EmailSignin: "Could not send the verification email. Please try again.",
    CredentialsSignin: "Sign in failed. Check your credentials and try again.",
    SessionRequired: "Please sign in to access this page.",
    Default: "An unexpected error occurred. Please try again.",
  };

  return errorMessages[error] ?? errorMessages.Default!;
}
