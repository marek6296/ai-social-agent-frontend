"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  MessageSquare,
  CheckCircle2,
  TrendingUp,
  Clock,
  Globe,
  MessageCircle,
  Send,
  Instagram,
  Bot,
  Settings,
  BarChart3,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const services = [
  {
    id: "web-bot",
    title: "AI Chatbot pre Web",
    description: "Inteligentný chatbot pre tvoj web, ktorý odpovedá na otázky návštevníkov a zachytáva leady. Jednoduchá integrácia pomocou embed kódu.",
    icon: Globe,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    hoverColor: "hover:bg-emerald-500/20",
    borderColor: "border-emerald-500/20",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    features: [
      "24/7 automatické odpovede",
      "Zbieranie leadov",
      "Integrácia na akýkoľvek web",
      "Štatistiky a analýzy",
    ],
  },
  {
    id: "discord-bot",
    title: "Discord Chatbot",
    description: "Plnohodnotný Discord bot s AI odpoveďami, moderáciou, welcome správami, eventami, ankietami a interaktívnymi menu. Kompletná automatizácia servera.",
    icon: MessageCircle,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    hoverColor: "hover:bg-indigo-500/20",
    borderColor: "border-indigo-500/20",
    gradient: "from-indigo-500/10 to-indigo-500/5",
    features: [
      "AI odpovede na správy",
      "Moderácia a bezpečnosť",
      "Welcome & onboarding",
      "Eventy a ankety",
      "Interaktívne menu",
    ],
  },
  {
    id: "telegram-bot",
    title: "Telegram Chatbot",
    description: "Vytvor Telegram bota, ktorý komunikuje s používateľmi a poskytuje automatizované odpovede. Ideálny pre podporu zákazníkov.",
    icon: Send,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    hoverColor: "hover:bg-blue-500/20",
    borderColor: "border-blue-500/20",
    gradient: "from-blue-500/10 to-blue-500/5",
    features: [
      "AI konverzácie",
      "Automatizované odpovede",
      "Správa zákazníkov",
      "Analytics a reporting",
    ],
  },
  {
    id: "instagram-bot",
    title: "Instagram Chatbot",
    description: "Automatizuj odpovede na Instagram DMs a komentáre s pomocou AI chatbota. Zvyšuj engagement a odpovedaj zákazníkom okamžite.",
    icon: Instagram,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    hoverColor: "hover:bg-pink-500/20",
    borderColor: "border-pink-500/20",
    gradient: "from-pink-500/10 to-pink-500/5",
    features: [
      "Odpovede na DMs",
      "Správa komentárov",
      "Zvyšovanie engagement",
      "Automatizácia komunikácie",
    ],
  },
];

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
            <Link href="#services" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
              Služby
            </Link>
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
              AI automatizácia pre sociálne siete
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight px-2">
              Vytvor si svojho
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AI asistenta
              </span>
            </h1>
            <p className="max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground px-4">
              AI Social Agent je platforma pre vytvorenie inteligentných chatbotov pre web, Discord, Telegram a Instagram. 
              Automatizuj komunikáciu, zvyšuj engagement a šetrí čas tvojho tímu.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Button size="default" className="text-sm sm:text-base px-4 sm:px-6" asChild>
                <Link href="/signup">
                  Začať zadarmo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="default" variant="outline" className="text-sm sm:text-base px-4 sm:px-6" asChild>
                <Link href="#services">
                  Pozrieť služby
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
                Jednoduchá konfigurácia
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                AI powered
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="container py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Naše služby
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vyber si správneho AI asistenta pre tvoju platformu
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex"
              >
                <Card className="group relative w-full flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 overflow-hidden border-border/50">
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} transition-all duration-500 pointer-events-none opacity-0 group-hover:opacity-100`} />
                  
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
                    transition={{ duration: 0.7 }}
                  />
                  
                  <CardHeader className="relative z-10 pb-4 flex-1 flex flex-col">
                    <div className={`h-16 w-16 rounded-2xl ${service.bgColor} ${service.hoverColor} flex items-center justify-center mb-6 transition-colors shadow-lg border ${service.borderColor}`}>
                      <service.icon className={`h-8 w-8 ${service.color}`} />
                    </div>
                    <CardTitle className="text-2xl mb-3">{service.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed flex-1 mb-4">
                      {service.description}
                    </CardDescription>
                    <div className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                  <CardFooter className="relative z-10 pt-0 mt-auto">
                    <Button
                      asChild
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                    >
                      <Link href="/signup" className="flex items-center justify-center gap-2">
                        <span>Začať</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24 px-4 sm:px-6">
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
              Všetko, čo potrebuješ pre profesionálnych AI asistentov na jednom mieste.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Rýchle odpovede",
                description: "AI asistenti odpovedajú v reálnom čase, 24/7 bez prestávok.",
              },
              {
                icon: Shield,
                title: "Bezpečné a spoľahlivé",
                description: "Tvoje dáta sú v bezpečí a služby sú vždy dostupné.",
              },
              {
                icon: Settings,
                title: "Jednoduchá konfigurácia",
                description: "Nastavenie za minúty pomocou intuitívneho dashboardu.",
              },
              {
                icon: BarChart3,
                title: "Analytics a štatistiky",
                description: "Sleduj výkon a optimalizuj komunikáciu s detailnými analýzami.",
              },
              {
                icon: Users,
                title: "Multi-platform podpora",
                description: "Jeden dashboard pre všetky platformy - web, Discord, Telegram, Instagram.",
              },
              {
                icon: Bot,
                title: "AI powered",
                description: "Vykročný AI model, ktorý sa učí a prispôsobuje tvojim potrebám.",
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

      {/* Benefits Section */}
      <section className="container py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Card className="border-2 shadow-xl bg-gradient-to-br from-card to-card/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b text-center">
              <CardTitle className="text-2xl mb-2">Výhody AI Social Agent</CardTitle>
              <CardDescription className="text-base">
                Všetko, čo potrebuješ pre úspešnú automatizáciu komunikácie
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: Clock,
                    title: "24/7 dostupnosť",
                    description: "Tvoji AI asistenti odpovedajú nepretržite, aj keď si offline.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Zvyšuje konverzie",
                    description: "Zbieraj leady automaticky a zvyšuj počet objednávok.",
                  },
                  {
                    icon: Zap,
                    title: "Okamžité odpovede",
                    description: "Zákazníci dostanú odpoveď za sekundy, nie hodiny alebo dni.",
                  },
                  {
                    icon: Users,
                    title: "Šetrí čas tímu",
                    description: "Automatizuj opakujúce sa otázky a uvoľni čas pre dôležité úlohy.",
                  },
                  {
                    icon: Shield,
                    title: "Bezpečnosť dát",
                    description: "Tvoje dáta sú šifrované a chránené podľa najvyšších štandardov.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Bez záväzkov",
                    description: "Začni zadarmo a zruš kedykoľvek. Žiadne skryté poplatky.",
                  },
                ].map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t text-center">
                <Button size="lg" className="text-base px-8" asChild>
                  <Link href="/signup">
                    Začať zadarmo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Bez kreditnej karty • Aktivácia za 2 minúty • Podpora 24/7
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24 px-4 sm:px-6">
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
              Vyber si plán, ktorý sedí tvojej firme. Všetky plány obsahujú prístup ku všetkým službám,
              pokročilé nastavenia a štatistiky.
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
                    Ideálne pre začiatky a testovanie.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      1 bot na platformu
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Základné funkcie
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Do 1 000 interakcií mesačne
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/signup">Začať zadarmo</Link>
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
                      Neobmedzený počet botov
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Všetky pokročilé funkcie
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Do 10 000 interakcií mesačne
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Prioritná podpora
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/signup">
                      Vybrať plán
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
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
                      Neobmedzený počet botov
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      White-label možnosť
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Individuálne limity
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Dedikovaná podpora
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/signup">Kontaktovať</Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 sm:px-6">
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
