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
        title: "Judge created",
        description: `"${formData.name}" has been added successfully`,
      });
      
      // Don't navigate immediately if we have a token to show
      if (!response.token) {
        navigate("/admin/judges");
      }
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || error?.message || "Failed to create judge";
      toast({
        title: "Failed to create judge",
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
        title: "Token copied",
        description: "Judge token copied to clipboard",
      });
    }
  };

  const copyLoginLink = () => {
    if (createdToken) {
      const loginLink = `${window.location.origin}/judge/login?token=${createdToken}`;
      navigator.clipboard.writeText(loginLink);
      toast({
        title: "Login link copied",
        description: "Judge login link copied to clipboard",
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
          <h1 className="text-3xl font-bold">Create New Judge</h1>
          <p className="text-muted-foreground mt-1">
            Add a new judge to the event
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Judge Information</CardTitle>
          <CardDescription>
            Fill in the details for the new judge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter judge's full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="judge@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization">Organization *</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => handleInputChange("organization", e.target.value)}
                placeholder="Company or institution name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Profile Image</Label>
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
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a profile image for the judge (optional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_path">Image Path (Alternative)</Label>
              <Input
                id="image_path"
                value={formData.image_path}
                onChange={(e) => handleInputChange("image_path", e.target.value)}
                placeholder="/uploads/judges/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Or specify an image path instead of uploading (optional)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/judges")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Creating..." : "Create Judge"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminJudgeNew;
