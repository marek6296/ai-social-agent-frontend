"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Zap, Shield, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const handleScrollToPricing = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const section = document.getElementById("pricing");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-1/4 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -left-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-lg sm:text-xl font-bold">AI Social Agent</span>
          </motion.div>

          <motion.nav
            className="flex items-center gap-2 sm:gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="#features" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
              Funkcie
            </Link>
            <Link href="#pricing" onClick={handleScrollToPricing} className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
              Cenník
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4" asChild>
                <Link href="/login">Prihlásiť</Link>
              </Button>
              <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-4" asChild>
                <Link href="/signup">
                  <span className="hidden sm:inline">Vytvoriť účet</span>
                  <span className="sm:hidden">Účet</span>
                  <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </div>
          </motion.nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4"
          >
            <Badge variant="secondary" className="gap-2">
              <Sparkles className="h-3 w-3" />
              AI chatbot pre firmy
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight px-2">
              Premení tvoju webstránku
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                na nonstop AI asistenta
              </span>
            </h1>
            <p className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground px-4">
              AI Social Agent je firemný AI chatbot, ktorý vie odpovedať na otázky
              zákazníkov, zbiera leady a pomáha s podporou – priamo na tvojom webe.
              Stačí vložiť krátky embed kód a chatbot beží 24/7.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Button size="default" className="text-sm sm:text-base px-4 sm:px-6" asChild>
                <Link href="/signup">
                  Vytvoriť chatbota
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="default" variant="outline" className="text-sm sm:text-base px-4 sm:px-6" asChild>
                <Link href="#pricing" onClick={handleScrollToPricing}>
                  Pozrieť cenník
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground mt-4 px-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Odpovede v reálnom čase, 24/7
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Jednoduchý embed na každý web
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Tréning na FAQ, článkoch a dokumentoch
              </div>
            </div>
          </motion.div>

          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-card/50 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
                      AI
                    </div>
                    <div>
                      <p className="font-semibold text-base">AI asistent</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-xs text-muted-foreground">Online teraz</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Live demo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 bg-gradient-to-b from-background to-muted/20">
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {/* User message */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-end"
                  >
                    <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground p-3 text-sm max-w-[80%] shadow-md">
                      <p>Ahoj, zaujíma ma, ako funguje váš AI chatbot a koľko to stojí?</p>
                    </div>
                  </motion.div>

                  {/* Bot response 1 */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl rounded-bl-sm bg-muted border p-3 text-sm max-w-[85%] shadow-sm">
                      <p className="font-medium mb-1">Ahoj! 👋</p>
                      <p>
                        AI Social Agent je firemný AI chatbot, ktorý odpovedá na otázky zákazníkov 24/7. 
                        Môžeš ho nastaviť podľa svojich FAQ a firemných informácií.
                      </p>
                    </div>
                  </motion.div>

                  {/* User message 2 */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex justify-end"
                  >
                    <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground p-3 text-sm max-w-[80%] shadow-md">
                      <p>Aké máte plány a ceny?</p>
                    </div>
                  </motion.div>

                  {/* Bot response 2 */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl rounded-bl-sm bg-muted border p-3 text-sm max-w-[85%] shadow-sm">
                      <p>
                        Máme 3 plány: <strong>Starter Free</strong> (zadarmo, 1000 konverzácií/mesiac), 
                        <strong> Pro</strong> (19.99€/mesiac, 10 000 konverzácií) a <strong>Agency</strong> 
                        (100€/mesiac, neobmedzene). Môžeš začať zadarmo a upgrade-núť kedykoľvek! 🚀
                      </p>
                    </div>
                  </motion.div>

                  {/* Typing indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ delay: 1.2, repeat: Infinity, duration: 1.5 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl rounded-bl-sm bg-muted border p-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0s" }}></div>
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Prečo AI Social Agent?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Všetko, čo potrebuješ pre profesionálny AI chatbot na tvojom webe.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Rýchle odpovede",
                description: "AI chatbot odpovedá v reálnom čase, 24/7 bez prestávok.",
              },
              {
                icon: Shield,
                title: "Bezpečné a spoľahlivé",
                description: "Tvoje dáta sú v bezpečí a chatbot je vždy dostupný.",
              },
              {
                icon: MessageSquare,
                title: "Jednoduchá integrácia",
                description: "Vlož jeden riadok kódu a chatbot je na tvojom webe.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Cenník
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vyber si plán, ktorý sedí tvojej firme. Všetky plány obsahujú AI
              chatbota, embed kód na web a základné štatistiky konverzácií.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Bez viazanosti, možnosť mesačného alebo ročného fakturovania.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Starter Free</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">Zadarmo</span>
                  </div>
                  <CardDescription className="mt-2">
                    Ideálne pre malé firmy a jednoduché FAQ.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      1 web + 1 chatbot
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Základný embed widget
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Do 1 000 konverzácií mesačne
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Vybrať plán
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full border-2 border-primary shadow-lg">
                <CardHeader>
                  <Badge className="w-fit mb-2">Najobľúbenejší</Badge>
                  <CardTitle>Pro</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">19.99 €</span>
                    <span className="text-muted-foreground"> / mesiac</span>
                  </div>
                  <CardDescription className="mt-2">
                    Pre rastúce firmy, ktoré potrebujú viac.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Neobmedzený počet chatbotov
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Pokročilé nastavenia a customizácia
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Do 10 000 konverzácií mesačne
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Prioritná podpora
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">
                    Vybrať plán
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Agency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Agency</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">100 €</span>
                    <span className="text-muted-foreground"> / mesiac</span>
                  </div>
                  <CardDescription className="mt-2">
                    Pre agentúry a väčšie tímy s viacerými klientmi.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Neobmedzený počet chatbotov
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      White-label možnosť
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Individuálne limity konverzácií
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Vybrať plán
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Social Agent. Všetky práva vyhradené.
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
              Pomoc
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Prihlásiť sa
            </Link>
            <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
              Vytvoriť účet
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
