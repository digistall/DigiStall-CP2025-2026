// mockUser.js - Mock data for testing without backend

// Main user for testing
export const mockUser = {
  // Personal Information
  fullName: "John Doe",
  education: "College Graduate",
  birthDate: "1993-05-12",
  civilStatus: "Married",
  contactNumber: "09123456789",
  mailingAddress: "123 Main Street, Barangay San Miguel, Naga City, Bicol",

  // Spouse Information
  spouseName: "Maria Santos Dela Cruz",
  spouseBirthDate: "1996-08-21",
  spouseEducation: "College Graduate",
  occupation: "Teacher",
  spouseContact: "09987654321",

  // Business Information
  businessCapitalization: 50000,
  sourceOfCapital: "Personal Savings",
  previousBusiness: "Small Grocery Store (2018-2020)",
  applicantRelative: "Pedro Dela Cruz - Stall #15",

  // Other Information
  emailAddress: "john.doe@example.com",
  stallNumber: "A-10",
};

// Alternative users for testing different scenarios
export const singleUser = {
  fullName: "Mark Johnson",
  education: "High School Graduate",
  birthDate: "2000-02-17",
  civilStatus: "Single",
  contactNumber: "09234567890",
  mailingAddress: "456 Rizal Avenue, Barangay Carolina, Naga City, Bicol",
  businessCapitalization: 40000,
  sourceOfCapital: "Family Support",
  previousBusiness: "None - First Time Business Owner",
  applicantRelative: "None",
  emailAddress: "mark.johnson@email.com",
  stallNumber: "B-05",
};

export const collegeGraduateUser = {
  fullName: "Robert Smith",
  education: "Bachelor's Degree in Business",
  birthDate: "1990-11-03",
  civilStatus: "Married",
  contactNumber: "09345678901",
  mailingAddress: "789 Lopez Street, Barangay San Felipe, Naga City, Bicol",

  spouseName: "Sarah Smith",
  spouseBirthDate: "1992-04-15",
  spouseEducation: "Bachelor's Degree in Nursing",
  occupation: "Registered Nurse",
  spouseContact: "09456789012",

  businessCapitalization: 120000,
  sourceOfCapital: "Personal Savings & Investment",
  previousBusiness: "Computer Shop (2019-2023)",
  applicantRelative: "James Smith - Stall #28",

  emailAddress: "robert.smith@gmail.com",
  stallNumber: "C-18",
};

export const newApplicantUser = {
  fullName: "Michael Brown",
  education: "Vocational Course in Mechanics",
  birthDate: "1997-07-30",
  civilStatus: "Single",
  contactNumber: "09567890123",
  mailingAddress:
    "321 Peñafrancia Avenue, Barangay Triangulo, Naga City, Bicol",

  businessCapitalization: 35000,
  sourceOfCapital: "OFW Savings",
  previousBusiness: "None",
  applicantRelative: "None",

  emailAddress: "michael.brown@yahoo.com",
  // No stallNumber - new applicant
};

// Array of all mock users for easy testing
export const allMockUsers = [
  mockUser,
  singleUser,
  collegeGraduateUser,
  newApplicantUser,
];

// Helper function to get random user
export const getRandomMockUser = () => {
  const randomIndex = Math.floor(Math.random() * allMockUsers.length);
  return allMockUsers[randomIndex];
};

// Helper function to simulate user data loading delay (for testing loading states)
export const getMockUserAsync = (delayMs = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockUser);
    }, delayMs);
  });
};
