import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { adminGetTeam, adminUpdateTeam } from "@/lib/api";
import type { UpdateTeamRequest, Team } from "@/lib/types";

const AdminTeamEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UpdateTeamRequest>({
    project_name: "",
    short_description: "",
    members: "",
  });

  useEffect(() => {
    if (id) {
      loadTeam();
    }
  }, [id]);

  const loadTeam = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const team = await adminGetTeam(parseInt(id));
      setFormData({
        project_name: team.project_name,
        short_description: team.short_description,
        members: team.members,
        team_leader_name: team.team_leader_name,
        team_leader_year: team.team_leader_year,
        team_leader_email: team.team_leader_email,
        team_leader_phone: team.team_leader_phone,
        project_domain: team.project_domain,
      });
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec du chargement de l'équipe";
      toast({
        title: "Échec du chargement de l'équipe",
        description: errorMessage,
        variant: "destructive",
      });
      navigate("/admin/teams");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateTeamRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setIsSubmitting(true);

    try {
      const submitData: UpdateTeamRequest = {
        ...formData,
      };

      await adminUpdateTeam(parseInt(id), submitData);
      
      toast({
        title: "Équipe mise à jour",
        description: `"${formData.project_name}" a été mise à jour avec succès`,
      });
      
      navigate("/admin/teams");
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec de la mise à jour de l'équipe";
      toast({
        title: "Échec de la mise à jour de l'équipe",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Chargement des détails de l'équipe...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/teams")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Modifier Équipe</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Mettre à jour les informations de l'équipe
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'Équipe</CardTitle>
          <CardDescription>
            Mettre à jour les détails de cette équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => handleInputChange("project_name", e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description *</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) => handleInputChange("short_description", e.target.value)}
                placeholder="Brief description of the project"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_leader_name">Team Leader Name</Label>
              <Input
                id="team_leader_name"
                value={formData.team_leader_name || ""}
                onChange={(e) => handleInputChange("team_leader_name", e.target.value)}
                placeholder="Enter team leader full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_leader_year">Team Leader Year of Study</Label>
              <Input
                id="team_leader_year"
                value={formData.team_leader_year || ""}
                onChange={(e) => handleInputChange("team_leader_year", e.target.value)}
                placeholder="e.g., 3rd year"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_leader_email">Team Leader Email</Label>
              <Input
                id="team_leader_email"
                type="email"
                value={formData.team_leader_email || ""}
                onChange={(e) => handleInputChange("team_leader_email", e.target.value)}
                placeholder="Enter team leader email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_leader_phone">Team Leader Phone</Label>
              <Input
                id="team_leader_phone"
                value={formData.team_leader_phone || ""}
                onChange={(e) => handleInputChange("team_leader_phone", e.target.value)}
                placeholder="Enter team leader phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_domain">Project Domain</Label>
              <Input
                id="project_domain"
                value={formData.project_domain || ""}
                onChange={(e) => handleInputChange("project_domain", e.target.value)}
                placeholder="e.g., Agriculture, Healthcare"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="members">Team Members *</Label>
              <Input
                id="members"
                value={formData.members}
                onChange={(e) => handleInputChange("members", e.target.value)}
                placeholder="Enter names separated by semicolons (e.g., John;Sarah;Mike)"
                required
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple members with semicolons (;)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/teams")}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Mise à jour..." : "Mettre à Jour Équipe"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamEdit;

