import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logoBlack from "@/assets/logo-landscape-black.svg";
import logoWhite from "@/assets/logo-landscape-white.svg";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <img
        src={isDark ? logoWhite : logoBlack}
        alt="Landing Partners"
        className="h-6"
      />
      <div className="flex items-center gap-3">
        <button onClick={toggleDark} className="p-1.5 rounded hover:bg-muted transition-colors cursor-pointer" aria-label="Toggle dark mode">
          {isDark ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
        </button>
        <LanguageSwitcher />
        {user ? (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[200px]">
              {user.user_metadata?.full_name || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Uitloggen</span>
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-2">
            <LogIn className="h-4 w-4" />
            Inloggen
          </Button>
        )}
      </div>
    </header>
  );
}
