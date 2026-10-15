import { Card, CardHeader } from "@/components/ui";
import { PasswordForm } from "@/components/password-form";
import { emailOf, findAccount } from "@/lib/accounts";
import { currentUser } from "@/lib/data";

/** My account: who I'm logged in as, and change my password. */
export default async function AccountPage() {
  const user = await currentUser();
  const email = emailOf(user.id);
  const hasAccount = email ? !!(await findAccount(email).catch(() => null)) : false;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">My account</h1>
      <Card>
        <CardHeader title={user.name} subtitle={email ?? "No login"} />
        <div className="p-4">
          {email ? (
            <>
              {!hasAccount && <p className="mb-3 text-sm text-muted">You&apos;re still on the old shared password. Set your own password now — the old one stops working for you right after.</p>}
              <PasswordForm user={user.id} askCurrent={hasAccount} label={hasAccount ? "Change my password" : "Set my password"} />
            </>
          ) : (
            <p className="text-sm text-muted">This user can&apos;t log in.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
