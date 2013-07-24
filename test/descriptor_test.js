var helper = require('./test_helper');
var assert = require('assert');
var http = require('http');
var express = require('express');
var app = express();
var ac = require('../index');
var logger = require('./logger');
var addon = {};

describe('Descriptor', function(){
  var server = {};

  before(function(done){
    app.set('env','development');
    addon = ac(app, {
      config: {
        key: 'my-test-app-key',
        name: 'My Test App Name',
        description: 'My test app description.',
        version: '1',
        vendorName: 'My Company',
        vendorUrl: 'http://example.com',
        permissions: ['create_oauth_link'],
        documentationUrl: 'http://example.com',
        development: {}
      }
    }, logger);
    server = http.createServer(app).listen(3001, done);
  });

  after(function(done){
    server.close();
    done();
  });

  it('should be parsed as an object', function(done){
    assert.equal(typeof addon.descriptor, 'object');
    done();
  });

  it('should have variables replaced from the addon config', function(done){
    var key = addon.descriptor.key();
    assert.equal(typeof key, 'string');
    assert.equal(key, 'my-test-app-key');
    var name = addon.descriptor.name();
    assert.equal(typeof name, 'string');
    assert.equal(name, 'My Test App Name');
    var description = addon.descriptor.description();
    assert.equal(typeof description, 'string');
    assert.equal(description, 'My test app description.');
    var version = addon.descriptor.version();
    assert.equal(typeof version, 'string');
    assert.equal(version, '1');
    var vendorName = addon.descriptor.vendorName();
    assert.equal(typeof vendorName, 'string');
    assert.equal(vendorName, 'My Company');
    var vendorUrl = addon.descriptor.vendorUrl();
    assert.equal(typeof vendorUrl, 'string');
    assert.equal(vendorUrl, 'http://example.com');
    var permissions = addon.descriptor.permissions();
    assert.deepEqual(permissions, ['create_oauth_link']);
    var docUrl = addon.descriptor.documentationUrl();
    assert.equal(typeof docUrl, 'string');
    assert.equal(docUrl, 'http://example.com');
    var configUrl = addon.descriptor.configureUrl();
    assert.equal(typeof configUrl, 'string');
    assert.equal(configUrl, '/plugins/servlet/remotable-plugins/my-test-app-key/config-page');
    done();
  });

  it('should list webhooks', function(done){
    var webhooks = addon.descriptor.webhooks();
    assert.equal(webhooks.length, 1);
    webhooks = addon.descriptor.webhooks('foo');
    assert.equal(webhooks.length, 0);
    webhooks = addon.descriptor.webhooks('remote_plugin_enabled');
    assert.equal(webhooks.length, 1);
    var webhook = webhooks[0];
    assert.equal(webhook.key, 'enabled');
    assert.equal(webhook.event, 'remote_plugin_enabled');
    assert.equal(webhook.url, '/enabled');
    done();
  });

});