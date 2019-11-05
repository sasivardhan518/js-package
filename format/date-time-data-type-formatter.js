"use strict";
exports.__esModule = true;
var _ = require('../node_modules/lodash');
var moment = require('../node_modules/moment');
var DateTimeFormatter = (function () {
    function DateTimeFormatter() {}
    DateTimeFormatter.prototype.format = function (data, property, format, valuesNotToFormat) {
        _.forEach(data, function (record) {
            if (_.findIndex(valuesNotToFormat, record) === -1) {
                record[property] = moment(record[property]).isValid() ? moment(record[property]).format(format) : record[property];
            }
        })
    }
    return DateTimeFormatter;
}());
module.exports.DateTimeFormatter = DateTimeFormatter;