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
        title: "Token required",
        description: "Please enter your judge token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { judgeLogin } = await import("@/lib/api");
      const response = await judgeLogin({ token: loginToken });
      
      toast({
        title: "Login successful",
        description: `Welcome, ${response.judge.name}!`,
      });
      
      navigate("/judge/teams");
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || "Invalid token. Please check and try again.";
      toast({
        title: "Login failed",
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
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center mb-2">
            <Award className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Judge Portal</CardTitle>
          <CardDescription>
            Enter your unique token to access the evaluation platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Access Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your UUID token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your token was provided by the event organizer
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Continue to Evaluation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JudgeLogin;
