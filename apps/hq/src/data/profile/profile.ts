import type { Certification, Education, Experience, FeaturedItem, Language, Profile, Skill } from "@/src/types/profile";

export const profile: Profile = {
  name: "Harshit Pandey", headline: "Robotics Instructor and STEM Tutor | VLSI Design and Embedded Systems, Painting and Cycling", location: "Noida, Uttar Pradesh, India", contactLocation: "Sector 128, Noida, Uttar Pradesh", phone: "7392863010 (Work)", email: "harshitpandey3519@gmail.com",
  summary: ["Currently serving as an AI and Robotics Instructor at GeniusLabs Innovation Academy, leveraging certifications in VLSI design and Fusion 360 to support hands-on learning in STEM education.", "Actively pursuing a High School Diploma in Microelectronics at Jaypee Institute of Information Technology, with an expected graduation in June 2028.", "Previous roles include STEM Teacher at Multiverse Academia, where mathematics and science classes were led for middle and high school students, and Private Tutor, focusing on academic development in STEM subjects.", "Dedicated to fostering a passion for technology and innovation in students while building expertise in CAD and electrical engineering principles."],
  socialLinks: [{ name: "LinkedIn", url: "https://www.linkedin.com/in/harshit-pandey-digital", icon: "linkedin" }, { name: "Email", url: "mailto:harshitpandey3519@gmail.com", icon: "email" }],
};
export const experiences: Experience[] = [
  { company:"Genius Labs", role:"AI, Robotics and Tech Education Executive", date:"July 2026 — Present", location:"Noida", current:true },
  { company:"BrightCHAMPS", role:"Robotics Instructor", date:"February 2026 — May 2026", location:"Online" },
  { company:"Self Employed", role:"Private Tutor", date:"January 2025 — February 2026", location:"Noida, Uttar Pradesh, India" },
  { company:"Multiverse Academia", role:"STEM Teacher", date:"May 2023 — August 2024", description:["Taught Class 8 Mathematics and Science.", "Taught Class 9 Science.", "Mentored Class 10 students based on experience."] },
];
export const skills: Skill[] = ["Aeromodelling", "Automation", "Agentic AI Development"].map((name) => ({ name }));
export const languages: Language[] = [{ name:"Japanese", proficiency:"Elementary" }, { name:"Hindi", proficiency:"Native or Bilingual" }, { name:"English", proficiency:"Full Professional" }];
export const certifications: Certification[] = ["Fusion 360 Essentials for complete beginners", "IEEE Student Branch JIIT certified VLSI basics designer", "WIE IEEE ECE project exibition participation"].map((name) => ({ name }));
export const education: Education[] = [{ institution:"Jaypee Institute of Information Technology", qualification:"High School Diploma", field:"Electrical, Electronics and Communications Engineering", date:"June 2025 — June 2028" }, { institution:"Anil Saraswati Vidya Mandir School", date:"2015 — March 2025" }, { institution:"Vivekanand Public School", description:"schooling" }];
export const featuredItems: FeaturedItem[] = [];
