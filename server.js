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

const PORT = process.env.PORT || 4000;

async function startServer() {
    const app = express();

    // Parse JSON bodies globally BEFORE Apollo middleware
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));

    // Create Apollo Server
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

    // Start Apollo Server
    await server.start();

    // Apply Apollo middleware
    app.use('/graphql', expressMiddleware(server));

    // Connect to MongoDB
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }

    // Start Express server
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/graphql`);
    });

    return app;
}

const app = startServer();

module.exports = app;
