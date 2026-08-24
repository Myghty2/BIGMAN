/*
  BlueGuard mock project data (Seeded for Demo NGO ORG-001)
*/

export const projects = [
  {
    id: "BG-001",
    name: "Sundarbans Mangrove Revival",
    location: "West Bengal, India",
    status: "Verified",
    area: "125 ha",
    progress: 82,
    carbon: "18,450 tCO₂e",
    carbonEstimate: "18,450 tCO₂e",
    coordinates: [21.9497, 89.1833],
    organizationId: "ORG-001",
    organizationEmail: "demo@mangrove.org",
    organizationName: "Mangrove Guardians Foundation",
    description:
      "Mangrove restoration project focused on degraded coastal zones and long-term carbon sequestration.",
  },
  {
    id: "BG-002",
    name: "Konkan Blue Belt",
    location: "Maharashtra, India",
    status: "Under Review",
    area: "76 ha",
    progress: 61,
    carbon: "9,820 tCO₂e",
    carbonEstimate: "9,820 tCO₂e",
    coordinates: [16.9902, 73.3120],
    organizationId: "ORG-001",
    organizationEmail: "demo@mangrove.org",
    organizationName: "Mangrove Guardians Foundation",
    description:
      "Community-led coastal restoration project covering mangrove and seagrass habitats.",
  },
  {
    id: "BG-003",
    name: "Palk Bay Seagrass Recovery",
    location: "Tamil Nadu, India",
    status: "Monitoring",
    area: "94 ha",
    progress: 47,
    carbon: "12,100 tCO₂e",
    carbonEstimate: "12,100 tCO₂e",
    coordinates: [9.2800, 79.2500],
    organizationId: "ORG-001",
    organizationEmail: "demo@mangrove.org",
    organizationName: "Mangrove Guardians Foundation",
    description:
      "Seagrass restoration and biodiversity monitoring across selected coastal zones.",
  },
];

export const monitoringData = [
  { month: "Jan", vegetation: 62, carbon: 41 },
  { month: "Feb", vegetation: 67, carbon: 45 },
  { month: "Mar", vegetation: 71, carbon: 49 },
  { month: "Apr", vegetation: 76, carbon: 54 },
  { month: "May", vegetation: 82, carbon: 60 },
  { month: "Jun", vegetation: 85, carbon: 64 },
];
