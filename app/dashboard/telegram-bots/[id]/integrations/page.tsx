"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TelegramBotIntegrationsPage() {
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
          <CardTitle>Integrácie</CardTitle>
          <CardDescription>
            Webhooks a integrácie s externými službami
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Integrácie sú momentálne vo vývoji.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
