"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  ArrowLeft, 
  AlertTriangle, 
  Search,
  RefreshCw 
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function NotFound() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Animation mount effect
  useEffect(() => {
    setMounted(true);
    
    // Optional auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-primary/10 flex items-center justify-center p-4">
      <div className="relative">
        {/* Animated background elements */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/5 rounded-full animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary/5 rounded-full animate-pulse delay-1000" />
        
        <Card className={`
          max-w-2xl mx-auto text-center relative overflow-hidden
          transform transition-all duration-1000 ease-out
          ${mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
          hover:shadow-2xl hover:shadow-primary/10
          bg-gradient-to-br from-card via-card to-primary/5
          border-0 shadow-xl
        `}>
          <CardContent className="p-12">
            {/* Animated 404 Icon */}
            <div className="relative mb-8">
              <div className={`
                inline-flex items-center justify-center w-32 h-32 
                bg-gradient-to-br from-primary/20 to-primary/10 
                rounded-full mb-6 relative overflow-hidden
                transform transition-all duration-1000 delay-300
                ${mounted ? 'rotate-0 scale-100' : 'rotate-45 scale-0'}
              `}>
                <AlertTriangle className={`
                  w-16 h-16 text-primary
                  transform transition-all duration-1000 delay-500
                  ${mounted ? 'rotate-0' : 'rotate-180'}
                `} />
                
                {/* Animated rings */}
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
                <div className="absolute inset-2 border-2 border-primary/30 rounded-full animate-pulse" />
              </div>
              
              {/* 404 Text with stagger animation */}
              <div className="text-8xl font-bold text-primary/20 font-mono leading-none">
                {['4', '0', '4'].map((char, index) => (
                  <span
                    key={char + index}
                    className={`
                      inline-block transform transition-all duration-700
                      ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                    `}
                    style={{ transitionDelay: `${600 + index * 100}ms` }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Content with fade-in animation */}
            <div className={`
              space-y-6 transform transition-all duration-1000 delay-700
              ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Page Not Found
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                The page you're looking for doesn't exist or has been moved. 
                Don't worry, we'll help you get back on track.
              </p>

              {/* Auto-redirect notice */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mx-auto max-w-sm">
                <div className="flex items-center justify-center gap-2 text-sm text-primary">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auto-redirecting in {countdown}s</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  size="lg"
                  className="group hover:border-primary hover:text-primary transition-all duration-300"
                >
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Go Back
                </Button>
                
                <Link href="/dashboard">
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>

              {/* Additional help links */}
              <div className={`
                pt-8 border-t border-border/50 text-sm
                transform transition-all duration-1000 delay-1000
                ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
              `}>
                <p className="text-muted-foreground mb-4">
                  Need help? Try these popular pages:
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link 
                    href="/" 
                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/profile" 
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floating particles animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute w-2 h-2 bg-primary/20 rounded-full
                animate-float
              `}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}