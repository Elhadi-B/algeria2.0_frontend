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
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            Pitch Judging Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            A modern, real-time platform for managing and evaluating startup pitches at your incubator events
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate("/admin/login")}
              className="gap-2"
            >
              <Shield className="h-5 w-5" />
              Admin Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/judge/login")}
              className="gap-2"
            >
              <Award className="h-5 w-5" />
              Judge Portal
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-4" />
              <CardTitle>Admin Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage teams, judges, and view real-time rankings all from a powerful admin dashboard
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Award className="h-10 w-10 text-success mb-4" />
              <CardTitle>Easy Judging</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Intuitive evaluation interface with weighted scoring across multiple criteria
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-warning mb-4" />
              <CardTitle>Live Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Real-time WebSocket updates show rankings as judges submit their evaluations
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
