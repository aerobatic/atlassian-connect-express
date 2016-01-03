var utils = require('./utils');

module.exports = function (addon) {
    var descriptorJson = utils.loadJSON(addon.config.descriptorFile());

    ["localBaseUrl", "environment", "consumerKey"].forEach(function (key) {
        descriptorJson = utils.replaceTokensInJson(descriptorJson, '{{' + key + '}}', addon.config[key]());
    });

    if (typeof addon.config.descriptorTransformer === "function") {
        descriptorJson = addon.config.descriptorTransformer()(descriptorJson, addon.config);
    }

    return descriptorJson;
};
