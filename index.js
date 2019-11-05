var _ = require("lodash");

exports.__esModule = true;

var data_service = require("./report-data-service");

exports.reportdataservice = function() {
    return new data_service.ReportDataService();
}