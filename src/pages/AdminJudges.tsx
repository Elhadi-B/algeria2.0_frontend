import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Copy, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  adminListJudges,
  adminGetJudge,
  adminRegenerateToken,
  adminDeleteJudge,
} from "@/lib/api";
import type { Judge } from "@/lib/types";

const AdminJudges = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadJudges();
  }, []);

  const loadJudges = async () => {
    setIsLoading(true);
    try {
      const data = await adminListJudges();
      setJudges(data);
    } catch (error: any) {
      toast({
        title: "Failed to load judges",
        description: error?.error || error?.detail || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadJudgeDetails = async (id: number) => {
    try {
      const judge = await adminGetJudge(id);
      // Update the judge in the list with full details (including token)
      setJudges((prev) =>
        prev.map((j) => (j.id === id ? judge : j))
      );
      return judge;
    } catch (error: any) {
      toast({
        title: "Failed to load judge details",
        description: error?.error || error?.detail || "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const filteredJudges = judges.filter((judge) =>
    judge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    judge.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    judge.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToken = async (judgeId: number, currentToken?: string) => {
    let token = currentToken;
    
    // If token is masked, fetch full details
    if (!token || token === "***") {
      try {
        const judge = await loadJudgeDetails(judgeId);
        token = judge.token;
      } catch (error) {
        return;
      }
    }

    navigator.clipboard.writeText(token);
    toast({
      title: "Token copied",
      description: "Judge token copied to clipboard",
    });
  };

  const regenerateToken = async (judgeId: number, judgeName: string) => {
    try {
      const response = await adminRegenerateToken(judgeId);
      toast({
        title: "Token regenerated",
        description: `New token generated for ${judgeName}`,
      });
      
      // Update the judge in the list
      setJudges((prev) =>
        prev.map((j) =>
          j.id === judgeId
            ? {
                ...j,
                token: response.token,
                token_display: response.token,
              }
            : j
        )
      );

      // Copy new token if login link is available
      if (response.login_link) {
        navigator.clipboard.writeText(response.login_link);
      }
    } catch (error: any) {
      toast({
        title: "Failed to regenerate token",
        description: error?.error || error?.detail || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number, judgeName: string) => {
    if (!confirm(`Are you sure you want to delete "${judgeName}"?`)) {
      return;
    }

    try {
      await adminDeleteJudge(id);
      toast({
        title: "Judge deleted",
        description: `"${judgeName}" has been removed`,
      });
      loadJudges();
    } catch (error: any) {
      toast({
        title: "Failed to delete judge",
        description: error?.error || error?.detail || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Judges</h1>
          <p className="text-muted-foreground mt-1">
            Manage event judges and authentication
          </p>
        </div>
        <Button onClick={() => navigate("/admin/judges/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Judge
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search judges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Loading judges...</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJudges.map((judge) => {
            // Get the actual token (may need to fetch if masked)
            const displayToken = judge.token_display || judge.token || "***";
            const loginLink = `${window.location.origin}/judge/login?token=${displayToken !== "***" ? displayToken : ""}`;

            return (
              <Card key={judge.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{judge.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {judge.organization}
                      </p>
                    </div>
                    <Badge variant={judge.active ? "default" : "secondary"}>
                      {judge.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{judge.email}</p>
                  </div>
                  {judge.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="text-sm">{judge.phone}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Access Token</p>
                    <div className="flex gap-2">
                      <Input
                        value={displayToken}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToken(judge.id, displayToken)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => regenerateToken(judge.id, judge.name)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Judge Login Link</p>
                    <div className="flex gap-2">
                      <Input
                        value={displayToken !== "***" ? loginLink : "Click copy to get token first"}
                        readOnly
                        className="text-xs"
                      />
                      {displayToken !== "***" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(loginLink);
                            toast({
                              title: "Link copied",
                              description: "Judge login link copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredJudges.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No judges found</p>
          <Button className="mt-4" onClick={() => navigate("/admin/judges/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Judge
          </Button>
        </Card>
      )}
    </div>
  );
};

export default AdminJudges;
