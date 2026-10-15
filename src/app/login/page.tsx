import { LoginForm } from "./login-form";
import { authSecret } from "@/lib/session";

export const metadata = { title: "Log in — MD Golden Builders" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-light.png" alt="MD Golden Builders" className="mx-auto mb-6 h-20 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-dark.png" alt="" className="mx-auto mb-6 hidden h-20 w-auto dark:block" />
        {authSecret() ? (
          <LoginForm next={next} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-5 text-sm">
            <div className="font-semibold">Login is locked until it&apos;s set up</div>
            <p className="mt-1 text-muted">Add AUTH_SECRET in Vercel → Settings → Environment Variables, then redeploy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
