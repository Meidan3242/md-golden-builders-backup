"use server";

import { loggedInUser } from "@/lib/data";
import { testR2 } from "@/lib/storage";

export async function testStorage(): Promise<string> {
  const me = await loggedInUser();
  if (me?.role !== "admin") return "Only the owner can do this.";
  return testR2();
}
