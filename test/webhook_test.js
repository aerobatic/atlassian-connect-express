var helper = require('./test_helper');
var assert = require('assert');
var http = require('http');
var express = require('express');
var app = express();
var ac = require('../index');
var request = require('request');
var logger = require('./logger');
var jwt = require('jwt-simple');
var spy = require("sinon").spy;
var addon = {};

describe('Webhook', function () {
    var server;
    var hostServer;

    before(function (done) {
        ac.store.register("teststore", function (logger, opts) {
            var store = require("../lib/store/jugglingdb")(logger, opts);
            spy(store, "get");
            spy(store, "set");
            spy(store, "del");
            return store;
        });

        app.set('env', 'development');
        app.use(express.bodyParser());

        addon = ac(app, {
            config: {
                development: {
                    store: {
                        adapter: 'teststore',
                        type: "memory"
                    }
                }
            }
        }, logger);


        var host = express();
        // mock host
        host.get('/confluence/plugins/servlet/oauth/consumer-info', function (req, res) {
            res.set('Content-Type', 'application/xml');
            res.send(200, helper.consumerInfo);
        });

        host.post("/confluence/rest/atlassian-connect/latest/installer", function (req, res) {
            request({
                url: helper.addonBaseUrl + '/installed',
                qs: {
                    jwt: createJwtToken()
                },
                method: 'POST',
                json: helper.installedPayload
            });
            res.send(200);
        });

        hostServer = http.createServer(host).listen(3003, function () {
            server = http.createServer(app).listen(helper.addonPort, function () {
                done();
            });
        });
    });

    after(function (done) {
        server.close();
        hostServer.close();
        done();
    });

    function createJwtToken() {
        var jwtPayload = {
            "iss": helper.installedPayload.clientKey,
            "iat": 0,
            "exp": 1
        };

        return jwt.encode(jwtPayload, helper.installedPayload.sharedSecret);
    }

    function fireTestWebhook(route, body) {
        var url = helper.addonBaseUrl + route;

        var token = createJwtToken();
        console.log("url = " + url);

        var queryString = {
            "user_id": "admin",
            "jwt": token
        };

        request.post({
            url: url,
            qs: queryString,
            json: body
        }, function (err, res) {
            assert.equal(err, null);
            assert.equal(res.statusCode, 204, res.body);
        });
    }

    it('should fire an add-on event', function (done) {
        addon.once('plugin_test_hook', function (key, body, req) {
            assert(key === 'plugin_test_hook');
            assert(body != null && body.foo === 'bar');
            assert(req && req.param('user_id') === 'admin');
            done();
        });

        fireTestWebhook('/test-hook', {foo: 'bar'});
    });

//    it('should perform special oauth verification for the enabled webhook', function (done) {
//        var triggered = sinon.spy();
//        addon.once('webhook_auth_verification_triggered', triggered);
//        var successful = sinon.spy();
//        addon.once('installed_auth_verification_successful', successful);
//
//        addon.once('plugin_enabled', function (key, body, req) {
//            assert(triggered.called);
//            assert(successful.called);
//            done();
//        });
//
//        fireTestWebhook('/enabled', helper.installedPayload);
//    });
//
//    it('should perform normal oauth verification for other webhooks', function (done) {
//        var triggered = sinon.spy();
//        addon.once('webhook_oauth_verification_triggered', triggered);
//        var successful = sinon.spy();
//        addon.once('other_webhook_oauth_verification_successful', successful);
//
//        addon.once('plugin_test_hook', function (key, body, req) {
//            assert(triggered.called);
//            assert(successful.called);
//            done();
//        });
//
//        fireTestWebhook('/test-hook', {foo: 'bar'});
//    });

});
