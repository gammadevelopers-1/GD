export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="min-h-dvh bg-[#101214]">{children}</main>;
}
