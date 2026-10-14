import { BOTTOM, navFor } from "@/lib/nav-items";
import { Tile } from "@/components/ui";
import { currentUser } from "@/lib/data";

/** Phone: every section that isn't in the bottom bar. */
export default async function MorePage() {
  const user = await currentUser();
  const items = navFor(user.role).filter((n) => !BOTTOM.includes(n.href));
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">More</h1>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ href, label, icon: Icon }) => <Tile key={href} href={href} icon={<Icon />} title={label} />)}
      </div>
    </>
  );
}
