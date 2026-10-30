import type { HomeAbout } from "@/lib/gallery-types";

// Shown on the homepage until the section is saved from the admin dashboard.
export const defaultHomeAbout: HomeAbout = {
  filename: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1000&q=85",
  label: "Experience creativity",
  title: "A Space Where Art Comes Alive.",
  description: "We believe art has the power to connect people, express emotions, and transform perspectives. Our gallery brings together established artists and exciting new talent from different creative worlds.\n\nExplore carefully selected collections, attend special exhibitions, and discover the stories behind every masterpiece.",
  buttonText: "Discover Our Story",
  buttonLink: "/about",
};
