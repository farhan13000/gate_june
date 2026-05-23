import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

import { toast } from "sonner";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Problems", href: "/problems" },
  { label: "Contests", href: "/contests" },
  { label: "Theory", href: "/theory" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Discuss", href: "/discuss" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    console.log("[Navbar] Initiating logout...");
    setDropdownOpen(false);
    await logout();
    console.log("[Navbar] Logout complete.");
    toast.info("Signed Out", {
      description: "You have been successfully signed out.",
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111111] shadow-sm">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="text-lg font-semibold uppercase tracking-[0.25em] text-white">
          GATE <span className="text-[#2563eb]">DA</span>
        </Link>

        <nav className="hidden lg:flex flex-1 justify-center gap-8">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm transition-colors duration-150 ${
                  isActive ? "text-white font-semibold" : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/90 transition hover:border-white/20"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-9 w-9 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold text-white">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-[12px] border border-white/10 bg-[#111111] shadow-2xl">
                  <div className="border-b border-white/10 px-4 py-3 text-sm text-white/80">
                    <div className="font-semibold text-white">{user.fullName}</div>
                    <div className="mt-1 text-xs text-white/60">{user.email}</div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5"
                  >
                    Dashboard
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-3 text-sm text-[#93c5fd] hover:bg-white/5"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm text-[#fca5a5] hover:bg-white/5"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/80 transition hover:border-white/20 hover:text-white"
            >
              <LogIn size={16} />
            </Link>
          )}
        </div>

        <button
          className="lg:hidden p-2 text-white/70 transition hover:text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-[#111111] px-6 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block py-2 text-sm text-white/70 transition hover:text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 border-t border-white/10 pt-4">
            {isAuthenticated && user ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm text-white/80"
              >
                <LogOut size={16} /> Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-white/80"
                onClick={() => setOpen(false)}
              >
                <LogIn size={16} /> Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
