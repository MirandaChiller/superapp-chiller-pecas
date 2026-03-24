export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // Standalone layout — no Navigation bar, no container padding
  return <>{children}</>;
}
