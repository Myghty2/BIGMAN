/*
  BlueGuard mock project data
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

    coordinates: [21.9497, 89.1833],

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

    coordinates: [16.9902, 73.3120],

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

    coordinates: [9.2800, 79.2500],

    description:
      "Seagrass restoration and biodiversity monitoring across selected coastal zones.",
  },
];


/*
  Mock monitoring data
*/

export const monitoringData = [
  {
    month: "Jan",
    vegetation: 62,
    carbon: 41,
  },

  {
    month: "Feb",
    vegetation: 67,
    carbon: 45,
  },

  {
    month: "Mar",
    vegetation: 71,
    carbon: 49,
  },

  {
    month: "Apr",
    vegetation: 76,
    carbon: 54,
  },

  {
    month: "May",
    vegetation: 81,
    carbon: 61,
  },

  {
    month: "Jun",
    vegetation: 86,
    carbon: 68,
  },
];


/*
  Demo organizations.

  These are only for testing the login page.

  You can log in using:

  Email:
  demo@blueguard.org

  Password:
  BlueGuard123
*/

export const demoOrganizations = [
  {
    id: "ORG-DEMO-001",

    organizationName:
      "BlueGuard Coastal Foundation",

    organizationType:
      "NGO",

    registrationNumber:
      "NGO-DARPAN-DEMO-001",

    officialEmail:
      "demo@blueguard.org",

    phone:
      "+91 9876543210",

    representativeName:
      "Demo Administrator",

    designation:
      "Project Director",

    registeredAddress:
      "Mumbai, Maharashtra, India",

    state:
      "Maharashtra",

    website:
      "https://example.org",

    demoPassword:
      "BlueGuard123",

    status:
      "Verified",

    createdAt:
      "2026-08-01T00:00:00.000Z",
  },
];