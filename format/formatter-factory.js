var integerFormatter = require('./integer-data-type-formatter');
var floatFormatter = require('./float-data-type-formatter');
var dateTimeFormatter = require('./date-time-data-type-formatter');
var FormatTypesEnum = require('../format-types-enum');

"use strict";
var FormatterFactory = (function () {
    function FormatterFactory(dataType) {
        this.formatter = this.getFromatter(dataType);
    }
    FormatterFactory.prototype.getFromatter = function (dataType) {
        var formatter;
        switch (dataType) {
            case FormatTypesEnum.Integer:
                formatter = new integerFormatter.IntegerFormatter();
                break;
            case FormatTypesEnum.Float:
                formatter = new floatFormatter.FloatFormatter();
                break;
            case FormatTypesEnum.DateTime:
                formatter = new dateTimeFormatter.DateTimeFormatter();
                break;
        }
        return formatter;
    }

    FormatterFactory.prototype.format = function (data, property, format, valuesNotToFormat) {
        this.formatter.format(data, property, format, valuesNotToFormat);
    }
    return FormatterFactory;
}());
exports.FormatterFactory = FormatterFactory;