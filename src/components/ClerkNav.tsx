"use client";

import { useState, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/astro/react";

export default function ClerkNav() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      setIsDark(currentTheme === 'dark');
    };

    // Initial check
    checkTheme();

    // Listen for theme changes via data-theme attribute
    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const userButtonAppearance = {
    elements: {
      avatarBox: "user-avatar",
      userButtonPopoverCard: "user-popover-card",
      userButtonPopoverMain: "user-popover-main",
      userButtonPopoverFooter: "user-popover-footer",
      userButtonBox: "user-button-container",
      // Target specific menu items
      userButtonPopoverActionButton: {
        color: isDark ? "#f9fafb" : "#111827",
        "&:hover": {
          backgroundColor: isDark ? "#374151" : "#f3f4f6",
          color: isDark ? "#ffffff" : "#000000",
        }
      },
      userButtonPopoverActionButtonText: {
        color: isDark ? "#f9fafb" : "#111827",
      },
      userButtonPopoverActionButtonIcon: {
        color: isDark ? "#f9fafb" : "#111827",
      },
      // Target footer links (Sign Out)
      userButtonPopoverFooterPageLink: {
        color: isDark ? "#f9fafb" : "#111827",
        "&:hover": {
          color: isDark ? "#ffffff" : "#000000",
        }
      },
    },
    variables: {
      colorPrimary: isDark ? "#3b82f6" : "#2563eb",
      colorBackground: isDark ? "#1f2937" : "#ffffff",
      colorText: isDark ? "#f9fafb" : "#111827",
      colorTextSecondary: isDark ? "#d1d5db" : "#6b7280",
      colorInputBackground: isDark ? "#374151" : "#f9fafb",
      colorInputText: isDark ? "#f9fafb" : "#111827",
      colorDanger: isDark ? "#ef4444" : "#dc2626",
      borderRadius: "12px",
    },
  };

  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="nav-btn btn-login">
            <div className="btn-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10,17 15,12 10,7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <span className="btn-text">Login</span>
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="nav-btn btn-signup">
            <div className="btn-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <span className="btn-text">Sign Up</span>
          </button>
        </SignUpButton>
      </SignedOut>

      <SignedIn>
        <div className="user-section">
          <UserButton
            appearance={userButtonAppearance}
            showName={true}
          />
        </div>
      </SignedIn>
    </>
  );
}
