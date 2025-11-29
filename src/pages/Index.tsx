import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, Briefcase, Users, CheckCircle } from "lucide-react";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their respective dashboards
      navigate(userRole === 'admin' ? '/admin' : '/student');
    }
  }, [user, userRole, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-white" />
            <h1 className="text-2xl font-display font-bold text-white">KLU Internship Portal</h1>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center text-white animate-slide-up">
          <h2 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Remote Internship Management System
          </h2>
          <p className="text-xl md:text-2xl mb-12 text-white/90">
            Connecting talented students with exciting remote internship opportunities
          </p>
          
          <div className="flex gap-4 justify-center mb-20">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Student Portal
            </Button>
            <Button 
              size="lg" 
              className="text-lg px-8 bg-white text-primary hover:bg-white/90"
              onClick={() => navigate('/auth')}
            >
              <ShieldCheck className="mr-2 h-5 w-5" />
              Admin Portal
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
              <Briefcase className="h-12 w-12 mb-4 mx-auto text-secondary" />
              <h3 className="text-xl font-display font-bold mb-2">Browse Opportunities</h3>
              <p className="text-white/80">
                Explore internships from top companies across various domains
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
              <Users className="h-12 w-12 mb-4 mx-auto text-accent" />
              <h3 className="text-xl font-display font-bold mb-2">Easy Application</h3>
              <p className="text-white/80">
                Submit applications with one click and track your progress
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all">
              <CheckCircle className="h-12 w-12 mb-4 mx-auto text-secondary-light" />
              <h3 className="text-xl font-display font-bold mb-2">Real-time Updates</h3>
              <p className="text-white/80">
                Get instant notifications on your application status
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-white/60">
        <p>&copy; 2024 KLU Internship Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
