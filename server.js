const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const mongoose = require('mongoose');
const cors = require('cors');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

// MongoDB connection string
const MONGODB_URI =
    'mongodb+srv://luunguyenminhtriet021025_db_user:fellix021025@assignment1.kppwnc5.mongodb.net/comp3133_101542519_assignment1?retryWrites=true&w=majority';

const app = express();

// Parse JSON bodies globally BEFORE Apollo middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Cache the server startup promise so it only runs once
let serverStarted = false;

async function startApollo() {
    if (serverStarted) return;

    // Connect to MongoDB (reuse connection if already connected)
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully');
    }

    // Create and start Apollo Server
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        formatError: (error) => {
            return {
                message: error.message,
                code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
                path: error.path,
            };
        },
    });

    await server.start();

    // Apply Apollo middleware
    app.use('/graphql', expressMiddleware(server));

    serverStarted = true;
}

// Initialize before handling requests
const initPromise = startApollo();

// Middleware to wait for initialization
app.use(async (req, res, next) => {
    await initPromise;
    next();
});

// Local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    initPromise.then(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}/graphql`);
        });
    });
}

module.exports = app;
