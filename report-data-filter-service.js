"use strict";
exports.__esModule = true;
var _ = require("lodash");
var ReportDataFilterService = /** @class */ (function () {
    function ReportDataFilterService() {}
    ReportDataFilterService.prototype.filterData = function (data, filters) {
        var filteredData = [];
        for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
            var filter = filters_1[_i];
            filteredData = filteredData.concat(this.getFilteredData(data, filter));
        }
        return filteredData;
    };
    ReportDataFilterService.prototype.getFilteredData = function (data, attrVal) {
        var filterData = data;
        _.forEach(attrVal, function (value, key) {
            filterData = filterData.filter(function (record) {
                return value === record[key];
            });
        });
        return filterData;
    };
    return ReportDataFilterService;
}());
exports.ReportDataFilterService = ReportDataFilterService;