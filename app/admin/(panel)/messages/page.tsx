import { Suspense } from "react";
import Link from "next/link";
import { requireAdminPage } from "@/server/admin/guard";
import { ContactMessageModel, NotificationLogModel } from "@/models";
import { MessageStatus } from "@/components/admin/MessageStatus";
import { AdminPagination, Badge, dateTime, EmptyRow, listHref, PageHeader, pageOf, Table, TableSkeleton, td, th } from "@/components/admin/ui";

export const metadata = { title: "Messages" };
const PER_PAGE = 25;

export default function MessagesPage(props: PageProps<"/admin/messages">) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <Messages {...props} />
    </Suspense>
  );
}

async function Messages({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdminPage("messages");
  const sp = await searchParams;
  const tab = sp.tab === "outbox" ? "outbox" : "inbox";
  const rawPage = typeof sp.page === "string" ? sp.page : undefined;
  const tabCls = (active: boolean) => `label inline-flex h-10 items-center rounded-md px-4 ${active ? "bg-ink text-paper" : "border border-line bg-surface hover:border-ink"}`;

  return (
    <>
      <PageHeader title="Messages" text="Contact form messages, and every email / SMS the store has sent (or logged, while providers are in log mode)." />
      <div className="mb-4 flex gap-2" role="tablist">
        <Link href="/admin/messages" className={tabCls(tab === "inbox")} role="tab" aria-selected={tab === "inbox"}>Contact form</Link>
        <Link href="/admin/messages?tab=outbox" className={tabCls(tab === "outbox")} role="tab" aria-selected={tab === "outbox"}>Sent emails &amp; SMS</Link>
      </div>
      {tab === "inbox" ? <Inbox rawPage={rawPage} /> : <Outbox rawPage={rawPage} />}
    </>
  );
}

async function Inbox({ rawPage }: { rawPage?: string }) {
  const total = await ContactMessageModel.countDocuments();
  const { page, pages, skip } = pageOf(rawPage, total, PER_PAGE);
  const rows = await ContactMessageModel.find().sort({ status: 1, createdAt: -1 }).skip(skip).limit(PER_PAGE).lean();
  return (
    <>
      <Table minWidth="48rem">
        <thead><tr><th className={th}>From</th><th className={th}>Message</th><th className={th}>Received</th><th className={th}>Status</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((m) => (
            <tr key={String(m._id)} className={m.status === "new" ? "bg-warn/5" : ""}>
              <td className={td}>
                <span className="font-medium">{m.name}</span>
                <p className="text-xs"><a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message to Oxford Vale"}`)}`} className="underline">{m.email}</a></p>
                {m.phone && <p className="text-xs text-muted">{m.phone}</p>}
              </td>
              <td className={`${td} max-w-md`}>
                {m.subject && <p className="font-medium">{m.subject}</p>}
                <p className="whitespace-pre-line text-muted">{m.message}</p>
              </td>
              <td className={`${td} whitespace-nowrap`}>{dateTime(m.createdAt as Date)}</td>
              <td className={td}><MessageStatus id={String(m._id)} status={m.status} /></td>
            </tr>
          )) : <EmptyRow cols={4} text="No messages yet." />}
        </tbody>
      </Table>
      <AdminPagination page={page} pages={pages} total={total} href={(n) => listHref("/admin/messages", {}, { page: n })} />
    </>
  );
}

async function Outbox({ rawPage }: { rawPage?: string }) {
  const total = await NotificationLogModel.countDocuments();
  const { page, pages, skip } = pageOf(rawPage, total, PER_PAGE);
  const rows = await NotificationLogModel.find().sort({ createdAt: -1 }).skip(skip).limit(PER_PAGE).lean();
  return (
    <>
      <Table minWidth="52rem">
        <thead><tr><th className={th}>Sent</th><th className={th}>To</th><th className={th}>Content</th><th className={th}>Status</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((n) => (
            <tr key={String(n._id)}>
              <td className={`${td} whitespace-nowrap`}>{dateTime(n.createdAt as Date)}<p className="text-xs text-muted uppercase">{n.channel} · {n.provider}</p></td>
              <td className={td}>{n.to}{n.ref?.id && <p className="text-xs text-muted">{n.ref.type} {n.ref.id.length > 20 ? "" : n.ref.id}</p>}</td>
              <td className={`${td} max-w-md`}>
                {n.subject && <p className="font-medium">{n.subject}</p>}
                <details><summary className="cursor-pointer text-muted">Show text</summary><p className="mt-2 whitespace-pre-line text-xs">{n.body}</p></details>
              </td>
              <td className={td}>
                <Badge tone={n.status === "sent" ? "ok" : n.status === "failed" ? "bad" : "neutral"}>{n.status}</Badge>
                {n.error && <p className="mt-1 text-xs text-danger">{n.error}</p>}
              </td>
            </tr>
          )) : <EmptyRow cols={4} text="Nothing sent yet." />}
        </tbody>
      </Table>
      <AdminPagination page={page} pages={pages} total={total} href={(n) => listHref("/admin/messages", { tab: "outbox" }, { page: n })} />
    </>
  );
}
