import { redirect } from "next/navigation";

// `/` is kept as a redirect into the slide deck so old links keep working.
// The named slide route is `/landing`.
export default function Index() {
  redirect("/landing");
}
