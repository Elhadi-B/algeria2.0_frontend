import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shield, Award, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <img src="/logo/logo-algeria20.svg" alt="Algeria 2.0" className="h-24 w-24" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
             d'Évaluation Hackathon
          </h1>
          <p className="text-xl text-muted-foreground">
            Une plateforme moderne en temps réel pour gérer et évaluer les projets de hackathon lors de vos événements
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate("/admin/login")}
              className="gap-2"
            >
              <Shield className="h-5 w-5" />
              Tableau de Bord Admin
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/judge/login")}
              className="gap-2"
            >
              <Award className="h-5 w-5" />
              Portail Jury
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Contrôle Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gérez les équipes, les jurys et consultez les classements en temps réel depuis un tableau de bord admin puissant
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Award className="h-10 w-10 text-success mb-4" />
              <CardTitle>Évaluation Facile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Interface d'évaluation intuitive avec notation pondérée selon plusieurs critères
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-warning mb-4" />
              <CardTitle>Classements en Direct</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Mises à jour WebSocket en temps réel affichant les classements au fur et à mesure des soumissions des jurys
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
