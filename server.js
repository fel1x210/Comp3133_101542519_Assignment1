const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { expressMiddleware } = require('@apollo/server/express4');
const mongoose = require('mongoose');
const cors = require('cors');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

// MongoDB connection string
const MONGODB_URI =
    'mongodb+srv://luunguyenminhtriet021025_db_user:fellix021025@assignment1.kppwnc5.mongodb.net/comp3133_101542519_assignment1?retryWrites=true&w=majority';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Create Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
        ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
    formatError: (error) => ({
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path,
    }),
});

// Single startup promise (runs once, cached)
let startupPromise = null;

function ensureStarted() {
    if (!startupPromise) {
        startupPromise = (async () => {
            // Connect to MongoDB
            if (mongoose.connection.readyState !== 1) {
                await mongoose.connect(MONGODB_URI);
                console.log('MongoDB connected successfully');
            }
            // Start Apollo
            await server.start();
            // Mount GraphQL endpoint
            app.use('/graphql', expressMiddleware(server));
        })();
    }
    return startupPromise;
}

// Apollo Sandbox HTML
const sandboxHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Employee Management System - GraphQL API</title>
    <style>body { margin: 0; overflow: hidden; } #sandbox { height: 100vh; width: 100vw; }</style>
</head>
<body>
    <div id="sandbox"></div>
    <script src="https://embeddable-sandbox.cdn.apollographql.com/_latest/embeddable-sandbox.umd.production.min.js"></script>
    <script>
        new window.EmbeddedSandbox({ target: '#sandbox', initialEndpoint: window.location.origin + '/graphql' });
    </script>
</body>
</html>`;

// Root route
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(sandboxHtml);
});

// For Vercel: wrap in async handler
const handler = async (req, res) => {
    await ensureStarted();
    return app(req, res);
};

// Local development
if (process.env.NODE_ENV !== 'production') {
    ensureStarted().then(() => {
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}/graphql`);
        });
    });
}

module.exports = handler;
