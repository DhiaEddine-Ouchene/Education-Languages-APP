// This layout overrides the parent learn/layout for course detail pages.
// It removes padding/max-width to allow full-height/full-width document viewing.
export default function CourseDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
