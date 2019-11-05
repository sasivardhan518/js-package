"use strict";
exports.__esModule = true;
var _ = require("lodash");
var moment = require("moment");
var FormatTypesEnum = require("./format-types-enum");
var formatterModule = require("./format/formatter-factory");
var report_column_service = require("./report-column-service");
var MeasureAttributesEnum = require("./report-data-merge-service").MeasureAttributeEnum;

var ReportDataFormatService = /** @class */ (function () {
    function ReportDataFormatService() {
        this.reportColumnService = new report_column_service.ColumnService();
    }
    ReportDataFormatService.prototype.format = function (mergedData, allAttribsDataItemMap, newAttribValsObj) {
        var _this = this;
        Object.keys(allAttribsDataItemMap).forEach(function (key) {
            if (mergedData[key]) {
                allAttribsDataItemMap[key].displayDataItems.forEach(function (val) {
                    let newAttribValsData = [];
                    if (_.size(mergedData.newAttrUniqueValues) && _.size(mergedData.newAttrUniqueValues[key])) {
                        newAttribValsData = mergedData.newAttrUniqueValues[key];
                        mergedData[key] = _.differenceWith(mergedData[key], newAttribValsData, _.isEqual);
                    }
                    _this.getFormattedDataBasedOnDataType(val, mergedData[key], mergedData.newAttrValues);
                    mergedData[key] = _.concat(mergedData[key], newAttribValsData);
                });
                let columns = [key];
                if (key !== MeasureAttributesEnum.Name) {
                    mergedData[key] = _this.reportColumnService.getSortedData(mergedData[key], [], columns, null, null, allAttribsDataItemMap, newAttribValsObj, [], []);
                }
            } else {
                mergedData[key] = [];
            }
        });
        if (_.has(mergedData, 'newAttrValues')) {
            delete mergedData.newAttrValues;
        }
        return mergedData;
    };
    ReportDataFormatService.prototype.getFormattedDataBasedOnDataType = function (attribMapVal, mergedData, valuesNotToFormat) {
        if (attribMapVal.dataType.toLowerCase() === FormatTypesEnum.DateTime.toLowerCase() && attribMapVal.format) {
            var formatter = new formatterModule.FormatterFactory(attribMapVal.dataType);
            formatter.format(mergedData, attribMapVal.name, attribMapVal.format, valuesNotToFormat);
        }
    };
    return ReportDataFormatService;
}());
exports.ReportDataFormatService = ReportDataFormatService;