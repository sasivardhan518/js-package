"use strict";
exports.__esModule = true;
var _ = require('../node_modules/lodash');
var IntegerFormatter = (function () {
    function IntegerFormatter() {}
    IntegerFormatter.prototype.format = function (data, property, format, valuesNotToFormat) {
        _.forEach(data, function (record) {
            if (_.findIndex(valuesNotToFormat, record) === -1) {
                record[property] = parseInt(record[property]) || record[property];
            }
        });
    }
    return IntegerFormatter;
}());
module.exports.IntegerFormatter = IntegerFormatter;