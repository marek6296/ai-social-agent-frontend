import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const embedCode = `<script src="https://ai-social-agent-frontend.vercel.app/embed.js" data-bot-id="${user?.id ?? "TVOJ_BOT_ID"}"></script>`;

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Embed code:</p>
      <pre>{embedCode}</pre>
    </div>
  );
}