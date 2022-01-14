const express = require('express')
const app = express()
const router = require('./routes')
const cors = require('cors')

async function authValidator (req, res, next) {
    //auth bypass for metrics
    if (typeof req !== "undefined" && req.path === "/metrics") {
        next()
    }
    else {
        if (typeof req !== "undefined" && req.oidc !== undefined) {
            if (!req.oidc.isAuthenticated()) {
                res.status(401).send("Not authenticated")
            }
            else {
                next()    
            }
        }
        else {
            res.status(401).send("Not authenticated")
        }
    }
}

if ((process.env['AUTH0_BASEURL'] || false ) !== false) {
    app.use(cors({
        origin: process.env['FRONT_URL'] || "http://localhost:3000",
        credentials: true
    }))

    const { auth } = require('express-openid-connect');

    const config = {
        authRequired: false,
        auth0Logout: true,
        secret: process.env['AUTH0_SECRET'] || null, 
        baseURL: process.env['AUTH0_BASEURL'] || null,
        clientID: process.env['AUTH0_CLIENTID'] || null,
        issuerBaseURL: process.env['AUTH0_ISSUERURL'] || null
    };

    app.use(auth(config));
    app.use(authValidator)

    //add profile endpoint
    router.get('/profile', (req, res) => {
        res.send(JSON.stringify(req.oidc.user));
    });
}
else {
    app.use(cors({
        origin: process.env['FRONT_URL'] || "http://localhost:3000",
        credentials: true
    }))

    router.get('/profile', (req, res) => {
        res.send(JSON.stringify({}))
    })
}


app.use('/', router)
app.listen(3001)