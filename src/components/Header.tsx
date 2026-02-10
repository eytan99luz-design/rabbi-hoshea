import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-primary text-primary-foreground">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight">הרב הושע רבינוביץ׳</h1>
            <p className="text-xs text-primary-foreground/70 font-body">שיעורי תורה</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm font-body text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            ראשי
          </Link>
          <Link to="/browse" className="text-sm font-body text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            עיון
          </Link>
        </nav>
      </div>
    </header>
  );
}
