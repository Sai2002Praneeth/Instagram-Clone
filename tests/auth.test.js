const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const mongoose = require('mongoose');

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@test.com',
                password: 'password123'
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('username', 'testuser');
    });

    it('should login an existing user', async () => {
        // First create a user
        await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@test.com',
                password: 'password123'
            });

        // Then try to login
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@test.com',
                password: 'password123'
            });
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
}); 