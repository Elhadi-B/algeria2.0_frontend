import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Award } from "lucide-react";

const JudgeLogin = () => {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Auto-login if token is in URL
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      handleLogin(urlToken);
    }
  }, [searchParams]);

  const handleLogin = async (tokenValue?: string) => {
    const loginToken = tokenValue || token;
    
    if (!loginToken) {
      toast({
        title: "Jeton requis",
        description: "Veuillez entrer votre jeton de jury",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { judgeLogin } = await import("@/lib/api");
      const response = await judgeLogin({ token: loginToken });
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${response.judge.name}!`,
      });
      
      navigate("/judge/teams");
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || "Jeton invalide. Veuillez vérifier et réessayer.";
      toast({
        title: "Échec de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4">
            <img src="/logo/logo-algeria20.svg" alt="Algeria 2.0" className="h-16 w-16 mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Portail Jury</CardTitle>
          <CardDescription>
            Entrez votre jeton unique pour accéder à la plateforme d'évaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Jeton d'Accès</Label>
              <Input
                id="token"
                type="text"
                placeholder="Entrez votre jeton UUID"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Votre jeton a été fourni par l'organisateur de l'événement
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Vérification..." : "Continuer vers l'Évaluation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JudgeLogin;
