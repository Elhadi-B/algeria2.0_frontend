import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Copy } from "lucide-react";
import { adminCreateJudge } from "@/lib/api";
import type { CreateJudgeRequest } from "@/lib/types";

const AdminJudgeNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateJudgeRequest>({
    name: "",
    email: "",
    organization: "",
    phone: "",
    image_path: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateJudgeRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: CreateJudgeRequest = {
        ...formData,
        image: imageFile || undefined,
        image_path: formData.image_path || undefined,
      };

      const response = await adminCreateJudge(submitData);
      
      // Store the token to show to admin
      if (response.token) {
        setCreatedToken(response.token);
      }

      toast({
        title: "Jury créé",
        description: `"${formData.name}" a été ajouté avec succès`,
      });
      
      // Don't navigate immediately if we have a token to show
      if (!response.token) {
        navigate("/admin/judges");
      }
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Échec de la création du jury";
      toast({
        title: "Échec de la création du jury",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToken = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      toast({
        title: "Jeton copié",
        description: "Jeton du jury copié dans le presse-papiers",
      });
    }
  };

  const copyLoginLink = () => {
    if (createdToken) {
      const loginLink = `${window.location.origin}/judge/login?token=${createdToken}`;
      navigator.clipboard.writeText(loginLink);
      toast({
        title: "Lien de connexion copié",
        description: "Lien de connexion du jury copié dans le presse-papiers",
      });
    }
  };

  // If token was created, show success screen
  if (createdToken) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/judges")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Judge Created Successfully</h1>
            <p className="text-muted-foreground mt-1">
              Share the token or login link with {formData.name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Token</CardTitle>
            <CardDescription>
              Save this token - it won't be shown again in full
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Judge Token</Label>
              <div className="flex gap-2">
                <Input
                  value={createdToken}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyToken}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Login Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/judge/login?token=${createdToken}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyLoginLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with the judge to login directly
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={() => navigate("/admin/judges")}>
                Go to Judges List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/judges")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Créer Nouveau Jury</h1>
          <p className="text-muted-foreground mt-1">
            Ajouter un nouveau jury à l'événement
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du Jury</CardTitle>
          <CardDescription>
            Remplissez les détails du nouveau jury
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom Complet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Entrez le nom complet du jury"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="jury@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organisation *</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => handleInputChange("organization", e.target.value)}
                placeholder="Nom de l'entreprise ou de l'institution"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+213 555 123 456"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image de Profil</Label>
              <div className="space-y-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Téléchargez une image de profil pour le jury (optionnel)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_path">Chemin d'Image (Alternatif)</Label>
              <Input
                id="image_path"
                value={formData.image_path}
                onChange={(e) => handleInputChange("image_path", e.target.value)}
                placeholder="/uploads/judges/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Ou spécifiez un chemin d'image au lieu de télécharger (optionnel)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/judges")}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Création..." : "Créer Jury"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminJudgeNew;
