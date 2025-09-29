#!/usr/bin/env node

/**
 * Schedule API Test Script
 * Test all schedule CRUD endpoints
 */

import http from 'http';

const API_BASE = 'http://localhost:3888/api/v1/schedules';
const TEST_ACCOUNT = 'test-account-uuid';

// Mock data for testing
const testSchedule = {
    name: '测试提醒任务',
    description: '这是一个测试调度任务',
    taskType: 'REMINDER',
    scheduledTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
    priority: 'HIGH',
    payload: { message: '测试提醒内容' },
    recurrence: null,
    alertConfig: { enabled: true, beforeMinutes: 5 }
};

function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}${path}`;
        const urlObj = new URL(url);

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 3888,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'x-account-uuid': TEST_ACCOUNT,
                ...headers
            }
        };

        if (data && method !== 'GET') {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        headers: res.headers,
                        data: body ? JSON.parse(body) : null
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: body,
                        parseError: e.message
                    });
                }
            });
        });

        req.on('error', reject);

        if (data && method !== 'GET') {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testScheduleAPI() {
    console.log('🧪 Testing Schedule API...\n');

    try {
        // Test 1: Get Statistics (should work even with empty data)
        console.log('1. Testing GET /statistics...');
        const statsResponse = await makeRequest('GET', '/statistics');
        console.log(`   Status: ${statsResponse.status}`);
        console.log(`   Data:`, JSON.stringify(statsResponse.data, null, 2));
        console.log('');

        // Test 2: Get All Schedules (should return empty list initially)
        console.log('2. Testing GET / (all schedules)...');
        const listResponse = await makeRequest('GET', '/?page=1&limit=10');
        console.log(`   Status: ${listResponse.status}`);
        console.log(`   Data:`, JSON.stringify(listResponse.data, null, 2));
        console.log('');

        // Test 3: Create Schedule
        console.log('3. Testing POST / (create schedule)...');
        const createResponse = await makeRequest('POST', '/', testSchedule);
        console.log(`   Status: ${createResponse.status}`);
        console.log(`   Data:`, JSON.stringify(createResponse.data, null, 2));

        let scheduleUuid;
        if (createResponse.status === 201 && createResponse.data?.data?.uuid) {
            scheduleUuid = createResponse.data.data.uuid;
            console.log(`   ✅ Created schedule with UUID: ${scheduleUuid}`);
        } else {
            console.log('   ❌ Failed to create schedule');
            return;
        }
        console.log('');

        // Test 4: Get Schedule by ID
        console.log('4. Testing GET /:uuid (get schedule by ID)...');
        const getResponse = await makeRequest('GET', `/${scheduleUuid}`);
        console.log(`   Status: ${getResponse.status}`);
        console.log(`   Data:`, JSON.stringify(getResponse.data, null, 2));
        console.log('');

        // Test 5: Update Schedule
        console.log('5. Testing PUT /:uuid (update schedule)...');
        const updateData = {
            name: '更新后的提醒任务',
            description: '更新后的描述',
            priority: 'MEDIUM'
        };
        const updateResponse = await makeRequest('PUT', `/${scheduleUuid}`, updateData);
        console.log(`   Status: ${updateResponse.status}`);
        console.log(`   Data:`, JSON.stringify(updateResponse.data, null, 2));
        console.log('');

        // Test 6: Execute Schedule (if supported)
        console.log('6. Testing POST /:uuid/execute (execute schedule)...');
        const executeResponse = await makeRequest('POST', `/${scheduleUuid}/execute`);
        console.log(`   Status: ${executeResponse.status}`);
        console.log(`   Data:`, JSON.stringify(executeResponse.data, null, 2));
        console.log('');

        // Test 7: Delete Schedule
        console.log('7. Testing DELETE /:uuid (delete schedule)...');
        const deleteResponse = await makeRequest('DELETE', `/${scheduleUuid}`);
        console.log(`   Status: ${deleteResponse.status}`);
        console.log(`   Data:`, JSON.stringify(deleteResponse.data, null, 2));
        console.log('');

        console.log('🎉 API Test Complete!');

    } catch (error) {
        console.error('❌ Test Error:', error.message);
    }
}

// Run the test
testScheduleAPI().catch(console.error);