const axios = require('axios');

async function testDocumentAPI() {
  const baseURL = 'http://localhost:3001/api';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiTkNQTV9NYW5hZ2VyIiwiZW1haWwiOiJOQ1BNQGdtYWlsLmNvbSIsInVzZXJUeXBlIjoiYnJhbmNoX21hbmFnZXIiLCJyb2xlIjoiYnJhbmNoX21hbmFnZXIiLCJicmFuY2hJZCI6MSwidGltZXN0YW1wIjoiMjAyNS0xMS0xMlQwODozNDo1Ni4wOTVaIiwiaWF0IjoxNzMxMzk5Mjk2LCJqdGkiOiJhMjc3NzAzMC04NDZlLTRlNzctYWE0MS1kZTk5ZjQwNzZjNmIifQ.TDJYQfIIiYI5uQczfGu2N6lDVE7uGD9KH_1WVjxIBns';

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    console.log('📋 Testing Document Types endpoint...');
    const typesResponse = await axios.get(`${baseURL}/stallholders/documents/types`, { headers });
    console.log('✅ Document Types Response:', typesResponse.status);
    console.log('Data:', JSON.stringify(typesResponse.data, null, 2));

    console.log('\n📋 Testing Current Requirements endpoint...');
    const requirementsResponse = await axios.get(`${baseURL}/stallholders/documents/requirements`, { headers });
    console.log('✅ Requirements Response:', requirementsResponse.status);
    console.log('Data:', JSON.stringify(requirementsResponse.data, null, 2));

    // Test creating a new document requirement
    console.log('\n📋 Testing Create Document Requirement...');
    const newRequirement = {
      document_type_id: 5, // Valid ID
      is_required: 1,
      instructions: 'Test instructions for Valid ID'
    };

    const createResponse = await axios.post(`${baseURL}/stallholders/documents/requirements`, newRequirement, { headers });
    console.log('✅ Create Response:', createResponse.status);
    console.log('Data:', JSON.stringify(createResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing API:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full error data:', error.response?.data);
  }
}

testDocumentAPI();