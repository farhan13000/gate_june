import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

import { toast } from "sonner";

const navItems = [
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
    <header
      className="border-b border-border sticky top-0 z-50"
      style={{ backgroundColor: "hsl(var(--navbar-bg))", color: "hsl(var(--navbar-fg))" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif font-bold text-xl tracking-tight">
            GATE <span className="text-primary">DA</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm transition-colors duration-150 ${
                location.pathname.startsWith(item.href)
                  ? "text-white font-medium"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Auth section */}
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-6 h-6 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/30 border border-white/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden lg:inline max-w-[100px] truncate font-medium">
                  {user.fullName.split(" ")[0]}
                </span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-sm shadow-lg py-1 z-50"
                  style={{ backgroundColor: "hsl(var(--card))" }}
                >
                  <div className="px-3 py-2 border-b border-border">
                    <div className="text-xs font-medium text-foreground truncate">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate font-mono">
                      {user.email}
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    <User size={12} />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-white/20 rounded-sm text-white/80 hover:text-white hover:border-white/40 transition-colors"
            >
              <LogIn size={14} />
              Login
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-1 text-white/70 hover:text-white transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t border-white/10 px-6 py-4 space-y-3"
          style={{ backgroundColor: "hsl(var(--navbar-bg))" }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="block text-sm text-white/70 hover:text-white py-1 transition-colors duration-150"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Mobile auth */}
          <div className="pt-2 border-t border-white/10">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 py-1">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-6 h-6 rounded-full border border-white/20 object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/30 border border-white/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-white font-medium truncate">
                    {user.fullName}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                  }}
                  className="flex items-center gap-1.5 text-sm text-destructive py-1"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white py-1"
                onClick={() => setOpen(false)}
              >
                <LogIn size={14} />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
