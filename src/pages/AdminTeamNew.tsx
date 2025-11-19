import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { adminCreateTeam } from "@/lib/api";
import type { CreateTeamRequest } from "@/lib/types";

const AdminTeamNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateTeamRequest>({
    project_name: "",
    short_description: "",
    members: "",
  });

  const handleInputChange = (field: keyof CreateTeamRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: CreateTeamRequest = {
        ...formData,
      };

      await adminCreateTeam(submitData);
      
      toast({
        title: "Team created",
        description: `"${formData.project_name}" has been added successfully`,
      });
      
      navigate("/admin/teams");
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Failed to create team";
      toast({
        title: "Failed to create team",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/teams")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Team</h1>
          <p className="text-muted-foreground mt-1">
            Add a new team to the competition
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>
            Fill in the details for the new team
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamNew;

