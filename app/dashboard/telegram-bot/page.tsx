"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Send, ArrowLeft, Sparkles, Settings, FileText, BarChart3 } from "lucide-react";

export default function TelegramBotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/login");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Späť na produkty
            </Button>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Send className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Telegram Chatbot</h1>
                <p className="text-muted-foreground">Vytvor Telegram bota s AI asistentom</p>
              </div>
            </div>
          </div>

          {/* Coming Soon Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-border/50">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-10 w-10 text-blue-500" />
                </div>
                <CardTitle className="text-2xl mb-2">Telegram Chatbot</CardTitle>
                <CardDescription className="text-base">
                  Táto funkcionalita je momentálne vo vývoji
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground max-w-md mx-auto">
                  Telegram Chatbot umožní vytvoriť inteligentného bota pre Telegram, ktorý bude komunikovať 
                  s používateľmi, poskytovať informácie a automatizovať odpovede.
                </p>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Očakávané funkcie:
                  </p>
                  <div className="grid gap-3 md:grid-cols-3 max-w-2xl mx-auto text-left">
                    <div className="flex items-start gap-2">
                      <Settings className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Nastavenia bota</p>
                        <p className="text-xs text-muted-foreground">Konfigurácia správania</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Konverzácie</p>
                        <p className="text-xs text-muted-foreground">História správ</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Analytics</p>
                        <p className="text-xs text-muted-foreground">Štatistiky použitia</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}


