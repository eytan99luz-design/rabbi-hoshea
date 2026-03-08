import { Link } from "react-router-dom";
import { BookOpen, Heart, LogIn, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-primary text-primary-foreground">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <Link to="/admin" title="ניהול">
              <BookOpen className="h-5 w-5 text-accent-foreground" />
            </Link>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight">הרב הושע רבינוביץ׳</h1>
            <p className="text-xs text-primary-foreground/70 font-body">שיעורי תורה</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <Link to="/" className="text-sm font-body text-primary-foreground/80 hover:text-primary-foreground transition-colors hidden sm:block">
            ראשי
          </Link>
          <Link to="/browse" className="text-sm font-body text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            עיון
          </Link>
          <Link to="/articles" className="text-sm font-body text-primary-foreground/80 hover:text-primary-foreground transition-colors hidden sm:block">
            מאמרים
          </Link>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" dir="rtl">
                <DropdownMenuItem asChild>
                  <Link to="/my-lessons" className="flex items-center gap-2 font-body cursor-pointer">
                    <Heart className="h-4 w-4" />
                    השיעורים שלי
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="flex items-center gap-2 font-body cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 font-body gap-1.5">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">התחבר</span>
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
