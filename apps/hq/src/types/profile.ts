export type SocialIcon = "linkedin" | "email";

export type SocialLink = {
  name: string;
  url: string;
  icon: SocialIcon;
};

export type Profile = {
  name: string;
  headline: string;
  location: string;
  contactLocation: string;
  phone: string;
  email: string;
  summary: string[];
  avatar?: string;
  socialLinks: SocialLink[];
};
export type Experience = { company: string; role: string; date: string; location?: string; description?: string[]; current?: boolean };
export type Skill = { name: string };
export type Language = { name: string; proficiency: string };
export type Certification = { name: string; issuer?: string; date?: string; credentialId?: string; credentialUrl?: string; image?: string };
export type Education = { institution: string; qualification?: string; field?: string; date?: string; description?: string };
export type FeaturedItem = { id: string; title: string; description?: string; image?: string; href?: string; type: "event" | "project" | "post" | "media" };
