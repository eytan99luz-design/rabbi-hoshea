import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { t, dir } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: t("login.success") });
      navigate("/");
    } catch (err: any) {
      toast({ title: t("login.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password);
      toast({ title: t("login.registerSuccess"), description: t("login.registerDesc") });
    } catch (err: any) {
      toast({ title: t("login.registerError"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("login.title")} path="/login" />
      <Header />
      <div className="container px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-display text-xl text-center" dir={dir}>
              {t("login.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" dir={dir}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1 font-body gap-1.5">
                  <LogIn className="h-4 w-4" />
                  {t("login.tab.login")}
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1 font-body gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  {t("login.tab.register")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label className="font-body" dir={dir}>{t("login.email")}</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label className="font-body" dir={dir}>{t("login.password")}</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" className="mt-1" />
                  </div>
                  <Button type="submit" className="w-full font-body" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    {t("login.submit")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label className="font-body" dir={dir}>{t("login.email")}</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" className="mt-1" />
                  </div>
                  <div>
                    <Label className="font-body" dir={dir}>{t("login.password")}</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} dir="ltr" className="mt-1" />
                  </div>
                  <Button type="submit" className="w-full font-body" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    {t("login.register")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
