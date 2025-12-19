"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Send, Eye, BarChart3, RefreshCw } from "lucide-react";
import Link from "next/link";

interface MessageTemplate {
  id: string;
  name: string;
  guild_id: string;
  embed_json: any;
  components_json: any;
  pages_json: any[];
  version: number;
  created_at: string;
  updated_at: string;
}

interface PublishedMessage {
  id: string;
  template_id: string;
  channel_id: string;
  message_id: string;
  current_page_index: number;
}

export default function TemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [publishedMessages, setPublishedMessages] = useState<PublishedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollResults, setPollResults] = useState<Record<string, {
    votes: Array<{ user_id: string; option_index: number; option: string }>;
    counts: Record<number, number>;
    poll: { question: string; options: string[] };
  }>>({});
  const [loadingPollResults, setLoadingPollResults] = useState<Record<string, boolean>>({});
  const [expandedPolls, setExpandedPolls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (botId) {
      loadTemplates();
      loadPublishedMessages();
    }
  }, [botId]);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("discord_message_templates")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublishedMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("discord_published_messages")
        .select("*")
        .eq("bot_id", botId);

      if (error) throw error;
      setPublishedMessages(data || []);
    } catch (error) {
      console.error("Error loading published messages:", error);
    }
  };

  const loadPollResults = async (templateId: string, template: MessageTemplate) => {
    setLoadingPollResults(prev => ({ ...prev, [templateId]: true }));
    
    try {
      // Find published message for this template
      const { data: published } = await supabase
        .from("discord_published_messages")
        .select("id")
        .eq("template_id", templateId)
        .eq("bot_id", botId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!published) {
        setLoadingPollResults(prev => ({ ...prev, [templateId]: false }));
        return;
      }

      // Find poll in template pages
      const pages = template.pages_json || [];
      let poll: { question: string; options: string[] } | null = null;
      
      for (const page of pages) {
        if (page.components?.poll) {
          poll = {
            question: page.components.poll.question || "",
            options: page.components.poll.options || [],
          };
          break;
        }
      }

      if (!poll || poll.options.length === 0) {
        setLoadingPollResults(prev => ({ ...prev, [templateId]: false }));
        return;
      }

      // Load votes (select all fields including data_json for user_tag)
      const { data: votes, error } = await supabase
        .from("discord_message_state")
        .select("*")
        .eq("template_id", templateId)
        .eq("published_message_id", published.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Count votes per option
      const counts: Record<number, number> = {};
      poll.options.forEach((_, idx) => {
        counts[idx] = 0;
      });

      const voteList = (votes || []).map((vote: any) => {
        const optionIndex = parseInt(vote.status || "0", 10);
        if (!isNaN(optionIndex) && optionIndex >= 0 && optionIndex < poll!.options.length) {
          counts[optionIndex] = (counts[optionIndex] || 0) + 1;
          return {
            user_id: vote.user_id,
            option_index: optionIndex,
            option: poll!.options[optionIndex],
            data_json: vote.data_json, // Include data_json to get user_tag
          };
        }
        return null;
      }).filter(Boolean) as Array<{ user_id: string; option_index: number; option: string; data_json?: any }>;

      setPollResults(prev => ({
        ...prev,
        [templateId]: {
          votes: voteList,
          counts,
          poll,
        },
      }));
    } catch (error) {
      console.error("Error loading poll results:", error);
    } finally {
      setLoadingPollResults(prev => ({ ...prev, [templateId]: false }));
    }
  };

  const hasPoll = (template: MessageTemplate): boolean => {
    const pages = template.pages_json || [];
    for (const page of pages) {
      if (page.components?.poll?.options && page.components.poll.options.length > 0) {
        return true;
      }
    }
    return false;
  };

  const togglePollResults = (templateId: string, template: MessageTemplate) => {
    const newExpanded = new Set(expandedPolls);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
      if (!pollResults[templateId]) {
        loadPollResults(templateId, template);
      }
    }
    setExpandedPolls(newExpanded);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Naozaj chceš vymazať túto šablónu?")) return;

    try {
      const { error } = await supabase
        .from("discord_message_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Chyba pri mazaní šablóny");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/discord-bot")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Späť na Discord botov
      </Button>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Message Templates</h1>
            <p className="text-muted-foreground mt-1">
              Vytváraj a spravuj interaktívne Discord správy s buttons a select menus
            </p>
          </div>
          <Link href={`/dashboard/discord-bot/${botId}/templates/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nový template
            </Button>
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Ešte nemáš žiadne templates
            </h3>
            <p className="text-muted-foreground mb-4">
              Vytvor template pre interaktívne Discord správy
            </p>
            <Link href={`/dashboard/discord-bot/${botId}/templates/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Vytvoriť prvý template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => {
            const published = publishedMessages.filter(
              (pm) => pm.template_id === template.id
            );
            return (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle>{template.name}</CardTitle>
                        <Badge variant="outline">v{template.version}</Badge>
                        {published.length > 0 && (
                          <Badge variant="secondary">
                            {published.length} publikovaných
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          Pages: {template.pages_json?.length || 1}
                        </div>
                        <div>
                          Aktualizované:{" "}
                          {new Date(template.updated_at).toLocaleDateString("sk-SK")}
                        </div>
                        {hasPoll(template) && (
                          <div className="flex items-center gap-2 mt-2">
                            <BarChart3 className="h-3 w-3" />
                            <span className="text-xs">Obsahuje anketu</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasPoll(template) && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => togglePollResults(template.id, template)}
                          title="Zobraziť výsledky ankety"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Link href={`/dashboard/discord-bot/${botId}/templates/${template.id}`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/discord-bot/${botId}/templates/${template.id}/publish`}>
                        <Button variant="outline" size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {/* Poll Results */}
                {hasPoll(template) && expandedPolls.has(template.id) && (
                  <CardContent>
                    {loadingPollResults[template.id] ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : pollResults[template.id] ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            {pollResults[template.id].poll.question || "Výsledky ankety"}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadPollResults(template.id, template)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Obnoviť
                          </Button>
                        </div>
                        
                        {/* Results with chart */}
                        <div className="space-y-3">
                          {pollResults[template.id].poll.options.map((option, idx) => {
                            const count = pollResults[template.id].counts[idx] || 0;
                            const totalVotes = Object.values(pollResults[template.id].counts).reduce((a, b) => a + b, 0);
                            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                            
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{option}</span>
                                  <span className="text-muted-foreground">{count} ({percentage}%)</span>
                                </div>
                                {/* Bar chart */}
                                <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all duration-300 rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${percentage}%` }}
                                  >
                                    {percentage > 5 && (
                                      <span className="text-xs font-semibold text-primary-foreground">{percentage}%</span>
                                    )}
                                  </div>
                                </div>
                                {/* Who voted for this option */}
                                <div className="text-xs text-muted-foreground pl-2">
                                  {pollResults[template.id].votes
                                    .filter(v => v.option_index === idx)
                                    .map((v, i) => {
                                      // Try to get user_tag from data_json if available
                                      const userTag = (v as any).data_json?.user_tag || (v as any).user_tag;
                                      return (
                                        <span key={i}>
                                          <span className={userTag ? "font-medium text-foreground" : "font-mono"}>
                                            {userTag || `${v.user_id.substring(0, 8)}...`}
                                          </span>
                                          {i < pollResults[template.id].votes.filter(v => v.option_index === idx).length - 1 && ", "}
                                        </span>
                                      );
                                    })}
                                  {count === 0 && <span className="italic">Žiadne hlasy</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Total votes */}
                        <div className="pt-2 border-t text-sm text-muted-foreground">
                          Celkom hlasov: {Object.values(pollResults[template.id].counts).reduce((a, b) => a + b, 0)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground py-4 text-center">
                        Anketa ešte nemá žiadne hlasy alebo nie je publikovaná.
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

