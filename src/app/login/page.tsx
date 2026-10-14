import { LoginForm } from "./login-form";
import { USERS } from "@/lib/demo-data";
import { authSecret, envAnyCase, PASSWORD_ENV } from "@/lib/session";

export const metadata = { title: "Log in — MD Golden Builders" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const ready = !!authSecret();
  const people = USERS.map((u) => ({ id: u.id, name: u.name, title: u.title, ready: ready && !!envAnyCase(PASSWORD_ENV[u.id]) }));
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-light.png" alt="MD Golden Builders" className="mx-auto mb-6 h-20 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dark.png" alt="" className="mx-auto mb-6 hidden h-20 w-auto dark:block" />
        {ready ? (
          <LoginForm people={people} next={next} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm">
            <div className="font-semibold">Login is locked until it&apos;s set up</div>
            <p className="mt-1 text-muted">Add AUTH_SECRET and the passwords (PASS_MEIDAN, PASS_LALINE, PASS_SALES, PASS_PM) in Vercel → Settings → Environment Variables, then redeploy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
