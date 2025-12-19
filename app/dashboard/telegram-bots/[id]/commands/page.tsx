"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TelegramBotCommandsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/telegram-bots/${botId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Späť na prehľad
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Príkazy & Flow</CardTitle>
          <CardDescription>
            Správa príkazov a flow akcií pre bota
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Builder pre príkazy a flow akcie je momentálne vo vývoji.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
