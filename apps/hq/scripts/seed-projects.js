// Seed script for CEO project data
// Run with: node scripts/seed-projects.js (after setting up .env.local)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const projects = [
  {
    name: "Cloudiee-RC-Plane",
    slug: "cloudiee-rc-plane",
    category: "Robotics & Embedded Systems",
    status: null,
    progress: null,
    short_description:
      "Remote-control aircraft prototype focused on aeromodelling and hardware integration.",
    overview:
      "Designed and developed an RC plane project focused on remote control, flight dynamics, and hardware integration for aerial robotics experimentation. Worked on building and testing a practical prototype that combines electronics, control systems, and aeromodelling concepts.",
    skills: ["Aeromodelling"],
    technologies: null,
  },
  {
    name: "HexaRover",
    slug: "hexarover",
    category: "Robotics & Embedded Systems",
    status: null,
    progress: null,
    short_description:
      "Mars rover-inspired robotics platform featuring motor control and embedded system integration.",
    overview:
      "Designed and developed a Mars rover-inspired robotics platform featuring motor control, servo actuation, and embedded system integration for autonomous and remote-controlled movement. Built as a multidisciplinary hardware project combining mechanical design, electronics, and firmware development.",
    skills: ["Robotics"],
    technologies: null,
  },
  {
    name: "MicroBit Robot Car",
    slug: "microbit-robot-car",
    category: "Robotics & Embedded Systems",
    status: null,
    progress: null,
    short_description:
      "Micro:bit-based robotic car for exploration of embedded systems and control logic.",
    overview:
      "Designed and developed a micro:bit-based robotic car for hands-on exploration of embedded systems, robotics, and control logic. Focused on hardware integration, movement control, and building a practical prototype for learning and experimentation.",
    skills: ["Robotics"],
    technologies: null,
  },
  {
    name: "Smart Bike",
    slug: "smart-bike",
    category: "Robotics & Embedded Systems",
    status: null,
    progress: null,
    short_description:
      "Smart bike project featuring integrated hardware components.",
    overview:
      "Smart Bike hardware project featuring integrated mechanical and electronic components.",
    technical_documentation:
      "Smart Bike Hardware Components:\n\n- Driver\n- Wheels\n- Medium Motor\n- Large Hub\n- Accelerometer\n- Gyroscope",
    skills: null,
    technologies: null,
  },
  {
    name: "Naadix.xyz",
    slug: "naadix-xyz",
    category: "Web & EdTech",
    status: null,
    progress: null,
    short_description:
      "Built and developed Naadix.xyz, an edtech-focused platform.",
    overview:
      "Built and developed Naadix.xyz, an edtech-focused platform aimed at creating structured learning experiences and scalable educational services. Worked on the project from concept to implementation, with attention to product design, usability, and long-term growth potential.",
    skills: ["Web Development"],
    technologies: null,
  },
  {
    name: "Nexis – Desk Buddy",
    slug: "nexis-desk-buddy",
    category: "AI & Automation",
    status: null,
    progress: null,
    short_description:
      "AI-powered desk assistant combining software and hardware for task automation.",
    overview:
      "Developed Nexis, an AI-powered desk assistant that combines software and hardware to automate desktop tasks through intelligent task decomposition and execution. The system uses a Raspberry Pi as the agent host, breaks user requests into smaller subtasks, communicates with an ESP32 for hardware control, and uses Python to check task status and confirm completion.",
    skills: ["Automation"],
    technologies: null,
  },
  {
    name: "Oai",
    slug: "oai",
    category: "AI & Automation",
    status: null,
    progress: null,
    short_description:
      "AI-powered autonomous agent for desktop automation and hardware control.",
    overview:
      "Developed an AI-powered autonomous agent as the software core of Nexus, a Raspberry Pi-based desktop assistant. The agent interprets user requests, decomposes them into smaller executable subtasks, coordinates task execution, communicates with an ESP32 for hardware interactions, and verifies completion by retrieving system information through Python.",
    skills: ["Agentic AI Development"],
    technologies: null,
  },
  {
    name: "Social Media Content Generator",
    slug: "social-media-content-generator",
    category: "AI & Automation",
    status: null,
    progress: null,
    short_description:
      "AI-powered social media content generation system.",
    overview:
      "Developed an AI-powered social media content generation system that creates platform-ready captions and post ideas to streamline content creation and improve consistency across channels.",
    skills: null,
    technologies: null,
  },
  {
    name: "TechnoGrow – Solar Powered Hydroponic Farming System",
    slug: "technogrow-solar-powered-hydroponic-farming",
    category: "Sustainability / AgriTech",
    status: null,
    progress: null,
    short_description:
      "Sustainable solar-powered hydroponic farming system.",
    overview:
      "Developed a sustainable solar-powered hydroponic farming system that integrates renewable energy with soil-less agriculture to enable efficient, water-conscious crop cultivation. Contributed to the design and development of the prototype, promoting smart and sustainable farming solutions. The project was also selected for showcase in the official magazine of the Centre for Innovation, Creativity & Robotics (CICR), JIIT, recognizing its innovation and impact.",
    skills: ["Hydroponics"],
    technologies: null,
  },
];

async function seed() {
  console.log("Starting seed process...");

  try {
    // Clear existing projects (optional - comment out to keep existing data)
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .gte("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError && deleteError.code !== "PGRST116") {
      console.log("Could not clear existing projects:", deleteError);
    }

    // Insert projects
    for (const project of projects) {
      const { error } = await supabase
        .from("projects")
        .insert([project])
        .select();

      if (error) {
        console.error(`Error inserting ${project.name}:`, error);
      } else {
        console.log(`✓ Inserted: ${project.name}`);
      }
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
  }
}

seed();
