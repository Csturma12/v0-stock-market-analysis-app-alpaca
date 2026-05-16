import { LoginForm } from "./login-form"

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string }
}) {
  return <LoginForm nextPath={searchParams?.next ?? "/"} />
}
