import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, LogIn, LogOut, User, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { SiteContainer } from "@/components/layout";

import { toast } from "sonner";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Problems", href: "/problems" },
  { label: "PYQ", href: "/pyq" },
  { label: "Contests", href: "/contests" },
  { label: "Theory", href: "/theory" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Dashboard", href: "/dashboard" },
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

  useEffect(() => {
    setOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setOpen(false);
    await logout();
    toast.info("Signed Out", {
      description: "You have been successfully signed out.",
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <SiteContainer className="flex h-16 w-full items-center justify-between gap-3 lg:h-[72px]">
        <Link to="/" className="shrink-0 text-base font-bold uppercase tracking-[0.1em] text-[#10213f] sm:text-xl">
          GATE <span className="text-[#0b6fe8]">DA</span>
        </Link>

        <nav className="hidden h-full flex-1 items-center justify-center gap-4 lg:flex xl:gap-7 2xl:gap-9">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex h-full items-center border-b-2 text-[14px] font-medium transition-colors duration-150 xl:text-[15px] ${
                  isActive ? "border-[#0b6fe8] text-[#10213f]" : "border-transparent text-[#56657f] hover:text-[#10213f]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-2 py-2 text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
                aria-label="Open user menu"
                aria-expanded={dropdownOpen}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b6fe8] text-sm font-semibold text-white">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
                    <div className="font-semibold text-gray-900 truncate">{user.fullName}</div>
                    <div className="mt-0.5 text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-[#0b6fe8] hover:bg-gray-50"
                    >
                      <ShieldCheck size={15} />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-[38px] items-center justify-center rounded-[6px] border border-gray-200 bg-white px-5 text-[14px] font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Sign In
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </SiteContainer>

      {open && (
        <div className="border-t border-gray-200 bg-white shadow-xl lg:hidden">
          <SiteContainer className="py-3">
            <nav className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`rounded-sm px-3 py-2.5 text-[15px] transition ${
                      isActive
                        ? "bg-gray-50 font-semibold text-[#10213f] border-l-2 border-[#0b6fe8]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-3 border-t border-gray-200 pt-3">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex min-w-0 items-center gap-3 rounded-sm border border-gray-200 bg-gray-50 px-3 py-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="h-10 w-10 shrink-0 rounded-full border border-gray-300 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b6fe8] text-sm font-semibold text-white">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">{user.fullName}</div>
                    <div className="truncate text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User size={15} /> Dashboard
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center justify-center gap-2 rounded-sm border border-gray-200 px-3 py-2 text-sm text-[#0b6fe8] hover:bg-gray-50"
                    >
                      <ShieldCheck size={15} />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 rounded-sm border border-gray-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 hover:text-gray-900 sm:w-auto"
              >
                <LogIn size={16} /> Login
              </Link>
            )}
            </div>
          </SiteContainer>
        </div>
      )}
    </header>
  );
}
