"use strict";
exports.__esModule = true;
var _ = require('../node_modules/lodash');
var FloatFormatter = (function () {
    function FloatFormatter() {}
    FloatFormatter.prototype.format = function (data, property, format, valuesNotToFormat) {
        _.forEach(data, function (record) {
            if (_.findIndex(valuesNotToFormat, record) === -1) {
                record[property] = parseFloat(record[property]).toFixed(3) || record[property];
            }
        });
    }
    return FloatFormatter;
}());
module.exports.FloatFormatter = FloatFormatter;