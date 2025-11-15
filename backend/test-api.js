const https = require('http');

const BASE_URL = 'http://localhost:3010/api';

// Test data
let authToken = null;
let testUserId = null;
let testEmployeeId = null;

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test 1: Register a new user
async function testRegister() {
  console.log('\n1️⃣  Testing User Registration...');

  const response = await makeRequest('POST', '/auth/register', {
    email: `test.user.${Date.now()}@complihr.com`,
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'User',
  });

  if (response.status === 201 || response.status === 200) {
    console.log('   ✅ User registered successfully');
    console.log(`   📧 Email: ${response.data.user.email}`);
    console.log(`   🆔 User ID: ${response.data.user.id}`);
    console.log(`   🔑 Token: ${response.data.accessToken.substring(0, 20)}...`);

    authToken = response.data.accessToken;
    testUserId = response.data.user.id;
    return true;
  } else {
    console.log(`   ❌ Registration failed: ${response.status}`);
    console.log(`   Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Test 2: Login with the registered user
async function testLogin() {
  console.log('\n2️⃣  Testing User Login...');

  const response = await makeRequest('POST', '/auth/login', {
    email: `test.user.${testUserId}@complihr.com`,
    password: 'SecurePassword123!',
  });

  if (response.status === 200 || response.status === 201) {
    console.log('   ✅ Login successful');
    console.log(`   🔑 New Token: ${response.data.accessToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log(`   ❌ Login failed: ${response.status}`);
    console.log(`   Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Test 3: Get current user profile
async function testGetProfile() {
  console.log('\n3️⃣  Testing Get User Profile...');

  const response = await makeRequest('GET', '/auth/me', null, authToken);

  if (response.status === 200) {
    console.log('   ✅ Profile retrieved successfully');
    console.log(`   👤 Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
    console.log(`   📧 Email: ${response.data.user.email}`);
    return true;
  } else {
    console.log(`   ❌ Get profile failed: ${response.status}`);
    console.log(`   Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Test 4: Create an employee
async function testCreateEmployee() {
  console.log('\n4️⃣  Testing Create Employee...');

  const response = await makeRequest(
    'POST',
    '/employees',
    {
      employeeNumber: `EMP${Date.now()}`,
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-05-15',
      employment Type: 'FullTime',
      dateOfJoining: '2024-01-01',
      salary: 35000,
      personalEmail: 'john.doe@example.com',
      mobilePhone: '+447700900123',
    },
    authToken,
  );

  if (response.status === 201 || response.status === 200) {
    console.log('   ✅ Employee created successfully');
    console.log(`   🆔 Employee ID: ${response.data.id}`);
    console.log(`   👤 Name: ${response.data.firstName} ${response.data.lastName}`);
    console.log(`   #️⃣  Employee Number: ${response.data.employeeNumber}`);

    testEmployeeId = response.data.id;
    return true;
  } else {
    console.log(`   ❌ Create employee failed: ${response.status}`);
    console.log(`   Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Test 5: Get all employees
async function testGetAllEmployees() {
  console.log('\n5️⃣  Testing Get All Employees...');

  const response = await makeRequest('GET', '/employees?page=1&limit=10', null, authToken);

  if (response.status === 200) {
    console.log('   ✅ Employees retrieved successfully');
    console.log(`   📊 Total: ${response.data.total}`);
    console.log(`   📄 Page: ${response.data.page}/${response.data.totalPages}`);
    return true;
  } else {
    console.log(`   ❌ Get employees failed: ${response.status}`);
    console.log(`   Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Test 6: Get employee by ID
async function testGetEmployeeById() {
  console.log('\n6️⃣  Testing Get Employee by ID...');

  if (!testEmployeeId) {
    console.log('   ⏭️  Skipping (no employee created)');
    return true;
  }

  const response = await makeRequest('GET', `/employees/${testEmployeeId}`, null, authToken);

  if (response.status === 200) {
    console.log('   ✅ Employee retrieved successfully');
    console.log(`   👤 Name: ${response.data.firstName} ${response.data.lastName}`);
    console.log(`   💰 Salary: £${response.data.salary}`);
    return true;
  } else {
    console.log(`   ❌ Get employee by ID failed: ${response.status}`);
    console.log(`   Error: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 CompliHR API Tests');
  console.log('===================\n');
  console.log(`🌐 Base URL: ${BASE_URL}`);

  const results = [];

  try {
    results.push(await testRegister());
    results.push(await testLogin());
    results.push(await testGetProfile());
    results.push(await testCreateEmployee());
    results.push(await testGetAllEmployees());
    results.push(await testGetEmployeeById());

    console.log('\n📊 Test Summary');
    console.log('==============');
    const passed = results.filter((r) => r).length;
    const total = results.length;
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
      console.log('\n🎉 All tests passed!');
    }
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
  }
}

runTests();
