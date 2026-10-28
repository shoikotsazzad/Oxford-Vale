import { requestDB } from "@/server/request-db";
import { getT } from "@/server/i18n";
import { getCurrentUser } from "@/server/auth/session";
import { getUserProfile } from "@/server/services/account";
import { buildMetadata } from "@/lib/seo";
import { AddressBook } from "@/components/account/AddressBook";

export const metadata = buildMetadata({ title: "Addresses", noindex: true });

export default async function AddressesPage() {
  await requestDB();
  const [t, user] = await Promise.all([getT(), getCurrentUser()]);
  if (!user) return null;
  const profile = await getUserProfile(user.id);
  return (
    <div>
      <h1 className="font-serif text-4xl md:text-5xl">{t.account.addresses}</h1>
      <div className="mt-8"><AddressBook addresses={profile?.addresses ?? []} defaults={{ name: user.name, phone: user.phone }} /></div>
    </div>
  );
}
