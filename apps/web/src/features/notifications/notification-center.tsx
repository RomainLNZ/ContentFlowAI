import { useEffect, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useApplication } from "@/app/application-context";
import { apiRequest } from "@/lib/api-client";

type Notification = {
  id: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  actor: { fullName: string } | null;
  content: { id: string; title: string } | null;
};

export function NotificationCenter() {
  const { tenant } = useApplication();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const unread = items.filter((item) => !item.readAt).length;
  useEffect(() => {
    if (tenant)
      void apiRequest<{ items: Notification[] }>("/v1/notifications", {}, tenant).then((data) =>
        setItems(data.items),
      );
  }, [tenant]);
  async function readAll() {
    if (!tenant) return;
    await apiRequest("/v1/notifications/read-all", { method: "POST" }, tenant);
    setItems((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })),
    );
  }
  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 hover:bg-white/10"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-violet-500 px-1 text-[9px]">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#121319] p-3 shadow-2xl">
          <div className="flex items-center justify-between px-2 py-1">
            <strong>Notifications</strong>
            <div className="flex">
              <button
                title="Tout marquer comme lu"
                onClick={() => void readAll()}
                className="p-2 text-zinc-400"
              >
                <CheckCheck size={17} />
              </button>
              <button onClick={() => setOpen(false)} className="p-2 text-zinc-400">
                <X size={17} />
              </button>
            </div>
          </div>
          <div className="mt-2 max-h-96 overflow-auto">
            {items.length ? (
              items.map((item) => (
                <Link
                  key={item.id}
                  to={item.content ? `/app/content/${item.content.id}` : "/app"}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl p-3 text-sm hover:bg-white/5 ${item.readAt ? "text-zinc-500" : "bg-violet-500/[0.07]"}`}
                >
                  <span>{label(item.type)}</span>
                  {item.content && <strong className="mt-1 block text-zinc-200">{item.content.title}</strong>}
                  <small>{new Date(item.createdAt).toLocaleString("fr-FR")}</small>
                </Link>
              ))
            ) : (
              <p className="p-8 text-center text-sm text-zinc-500">Aucune notification.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function label(type: string) {
  return (
    (
      {
        CONTENT_ASSIGNED: "Un contenu vous a été assigné",
        REVIEW_REQUESTED: "Une validation est demandée",
        CONTENT_APPROVED: "Votre contenu a été validé",
        CHANGES_REQUESTED: "Des corrections sont demandées",
        COMMENT_ADDED: "Un commentaire a été ajouté",
        CONTENT_SCHEDULED: "Un contenu a été planifié",
      } as Record<string, string>
    )[type] ?? type
  );
}
