const ORGANIZATIONS_KEY = "blueguard_organizations";
const CURRENT_USER_KEY = "blueguard_current_user";


// Get organizations from localStorage
export function getOrganizations() {
  const storedOrganizations =
    localStorage.getItem(ORGANIZATIONS_KEY);

  if (!storedOrganizations) {
    return [];
  }

  try {
    return JSON.parse(storedOrganizations);
  } catch (error) {
    console.error("Error reading organizations:", error);
    return [];
  }
}


// Save organizations
function saveOrganizations(organizations) {
  localStorage.setItem(
    ORGANIZATIONS_KEY,
    JSON.stringify(organizations)
  );
}


// Register organization
export function registerOrganization(formData) {

  const organizations = getOrganizations();


  // Check duplicate email
  const existingEmail = organizations.find(
    (organization) =>
      organization.officialEmail.toLowerCase() ===
      formData.officialEmail.toLowerCase()
  );


  if (existingEmail) {
    return {
      success: false,
      message: "An organization with this email already exists.",
    };
  }


  // Check duplicate registration number
  const existingRegistration = organizations.find(
    (organization) =>
      organization.registrationNumber.toLowerCase() ===
      formData.registrationNumber.toLowerCase()
  );


  if (existingRegistration) {
    return {
      success: false,
      message: "This registration number is already registered.",
    };
  }


  const newOrganization = {
    id: `ORG-${String(organizations.length + 1).padStart(3, "0")}`,

    organizationName: formData.organizationName,

    organizationType: formData.organizationType,

    registrationNumber: formData.registrationNumber,

    officialEmail: formData.officialEmail,

    phone: formData.phone,

    representativeName: formData.representativeName,

    designation: formData.designation,

    registeredAddress: formData.registeredAddress,

    state: formData.state,

    website: formData.website || "",

    demoPassword: formData.password,

    status: "Pending Verification",

    createdAt: new Date().toISOString(),
  };


  organizations.push(newOrganization);

  saveOrganizations(organizations);


  return {
    success: true,
    organization: newOrganization,
    message:
      "Organization registered successfully.",
  };
}


// Login organization
export function loginOrganization(email, password) {

  const organizations = getOrganizations();


  const organization = organizations.find(
    (item) =>
      item.officialEmail.toLowerCase() ===
        email.toLowerCase() &&
      item.demoPassword === password
  );


  if (!organization) {

    return {
      success: false,
      message: "Invalid organization email or password.",
    };

  }


  const currentUser = {
    id: organization.id,

    organizationName:
      organization.organizationName,

    organizationType:
      organization.organizationType,

    officialEmail:
      organization.officialEmail,

    status:
      organization.status,
  };


  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(currentUser)
  );


  return {
    success: true,

    organization: currentUser,

    message: "Login successful.",
  };
}


// Get logged-in organization
export function getCurrentUser() {

  const storedUser =
    localStorage.getItem(CURRENT_USER_KEY);


  if (!storedUser) {
    return null;
  }


  try {
    return JSON.parse(storedUser);
  } catch (error) {
    return null;
  }
}


// Logout
export function logoutOrganization() {

  localStorage.removeItem(
    CURRENT_USER_KEY
  );

}


// Check authentication
export function isAuthenticated() {

  return getCurrentUser() !== null;

}