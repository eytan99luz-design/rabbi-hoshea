import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Lesson from "./pages/Lesson";
import Articles from "./pages/Articles";
import Admin from "./pages/Admin";
import Masechet from "./pages/Masechet";
import MyLessons from "./pages/MyLessons";
import Login from "./pages/Login";
import Stats from "./pages/Stats";
import Playlists from "./pages/Playlists";
import CalendarPage from "./pages/CalendarPage";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/lesson/:youtubeId" element={<Lesson />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/masechet/:name" element={<Masechet />} />
          <Route path="/my-lessons" element={<MyLessons />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
