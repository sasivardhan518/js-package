"use strict";
/// <reference path="./reprot-data-service.js" />
exports.__esModule = true;
var _ = require("lodash");
var common_utils_service = require('./common-utils-service');
var ReportMeasureResponse = (function () {

    var SummaryOrMeasureResponse = function () {
        this.isDataAvailable = false;
        this.isSummary = false;
        this.summary = null;
        this.measureResponse = null;
    };

    var MeasureResponse = function () {
        this.cachedStateId = 0;
        this.idForFullMeasureResponse = 0;
        this.isRetrievedFromCache = false;
        this.metaData = null;
        this.queryString = null;
        this.reportExecutionDuration = 0;
        this.resultData = new ResultData();
        this.uniqueLabelValues = [];
    };

    var ResultData = function () {
        this.columnMap = {};
        this._data = [];
        this.measureColumns = [];
        this.attribColumns = [];
    };

    var UnqiueValue = function () {
        this.resultData = new ResultData();
        this.requestedAttrib = '';
        this.numOfRows = 0;
        this.domainId = 0;
        this.queryString = null;
        this.isRetrievedFromCache = false;
    }

    function ReportMeasureResponse(reportDataService) {
        this.reportDataService = reportDataService;
        this.commonUtilsService = new common_utils_service.CommonUtilsService();
    }

    ReportMeasureResponse.prototype.getSummaryOrMeasureResponse = function (dataObject) {
        let _this = this;
        var mergedFormattedData = this.reportDataService.searchInMemory(dataObject, true);
        let summaryOrMeasureResponse = new SummaryOrMeasureResponse();
        if (!mergedFormattedData) {
            return summaryOrMeasureResponse;
        }
        if (mergedFormattedData.summaryResponse) {
            let summaryResponse = this.isSummaryAvailable(mergedFormattedData.summaryResponse, dataObject.outputFormat, _.get(dataObject, 'reportInfo.reportInfo.summarySettings.ruleBookId'));
            if (summaryResponse.isSummaryAvailable) {
                summaryOrMeasureResponse.isDataAvailable = true;
                summaryOrMeasureResponse.isSummary = true;
                summaryOrMeasureResponse.summary = summaryResponse.summary;
                summaryOrMeasureResponse.measureResponse = null;
                return summaryOrMeasureResponse;
            } else {
                summaryOrMeasureResponse.isDataAvailable = false;
                summaryOrMeasureResponse.isSummary = false;
                summaryOrMeasureResponse.summary = null;
                summaryOrMeasureResponse.measureResponse = null;
                return summaryOrMeasureResponse;
            }
        } else {
            // summaryOrMeasureResponse.isDataAvailable = true;
            // summaryOrMeasureResponse.isSummary = true;
            // summaryOrMeasureResponse.summary = null;
            // summaryOrMeasureResponse.measureResponse = null;
            return summaryOrMeasureResponse;
        }
        let domainId = dataObject.reportInfo.reportInfo.domainId;
        let measureResponse = this.getMeasureResponseForCurrentLevel(mergedFormattedData, domainId);
        if (this.reportDataService.isNestedReport) {
            let hierarchies = dataObject.reportInfo.reportInfo.hierarchies;
            let nestedHierarchies = this.reportDataService.getNestedHierarchies(hierarchies);
            let levels = [];
            _.forOwn(nestedHierarchies, function (value, nestedHierarchy) {
                levels.push(_this.commonUtilsService.getSequenceArray(value.hierarchyState.expandedLevels, 1));
            });
            let levelsArray = _this.commonUtilsService.cartesianProductOf(levels);
            let tempData = [];
            let columnMap = measureResponse.resultData.columnMap;
            _.each(levelsArray, function (levels) {
                let tempObj = {};
                let requestObject = _.cloneDeep(dataObject);
                _.each(Object.keys(nestedHierarchies), function (nestedHierarchy, index) {
                    let currentHierarchy = requestObject.reportInfo.reportInfo.hierarchies.find(function (x) {
                        return x.hierarchyState.hierarchyKey == nestedHierarchy;
                    });
                    tempObj[nestedHierarchy] = parseInt(levels[index]);
                    currentHierarchy.hierarchyState.expandedLevels = parseInt(levels[index]);
                    let groupedAttributesToRemove = currentHierarchy.hierarchies.slice(levels[index], currentHierarchy.hierarchies.length);
                    requestObject.outputFormat.groupedAttrs = _.difference(requestObject.outputFormat.groupedAttrs, groupedAttributesToRemove);
                    let otherLevelData = _this.reportDataService.searchInMemory(requestObject);
                    if (_.isEqual(dataObject, requestObject)) {
                        return;
                    }
                    let otherLevelDataMeasureResponse = _this.getMeasureResponseForCurrentLevel(otherLevelData, domainId);
                    let otherLevelDataColumnMap = otherLevelDataMeasureResponse.resultData.columnMap;
                    _.each(otherLevelDataMeasureResponse.resultData._data, function (record, index) {
                        let recordData = [];
                        _.forOwn(columnMap, function (columnIndex, columnKey) {
                            recordData.push(record[otherLevelDataColumnMap[columnKey]] ? record[otherLevelDataColumnMap[columnKey]] : null);
                        });
                        tempData.push(recordData);
                    });
                });
            });
            measureResponse.resultData._data = measureResponse.resultData._data.concat(tempData);
        }
        summaryOrMeasureResponse.isDataAvailable = true;
        summaryOrMeasureResponse.measureResponse = measureResponse;
        return summaryOrMeasureResponse;
    };

    ReportMeasureResponse.prototype.isSummaryOutputFormat = function (summaryOutputFormat, passedOutputFormat) {
        return _.isEqual(this.commonUtilsService.deepSort(summaryOutputFormat), this.commonUtilsService.deepSort(passedOutputFormat));
    };

    ReportMeasureResponse.prototype.getMeasureResponseForCurrentLevel = function (currentLevelData, domainId) {
        let result = new MeasureResponse();
        let keysWithMeasure = _.filter(_.keys(currentLevelData.data[0]), function (x) {
            return x.toString().toLowerCase() !== 'value';
        });
        let keysWithoutMeasure = _.filter(_.keys(currentLevelData.data[0]), function (x) {
            return x.toString().toLowerCase() !== 'value' && x.toString().toLowerCase() !== 'measure';
        });
        let measures = _.map(currentLevelData.MEASURE, function (msr) {
            return msr.MEASURE;
        });
        _.each(_.concat(keysWithoutMeasure, measures), function (column, index) {
            result.resultData.columnMap[column] = index;
        });
        result.resultData.attribColumns = keysWithoutMeasure;
        result.resultData.measureColumns = measures;
        let measureUniqObj = this.reportDataService.transformService.createUniqueObjWithProps(currentLevelData.data, keysWithMeasure, keysWithMeasure.concat('value'));
        let attributeUniqObj = this.reportDataService.transformService.createUniqueObjWithProps(currentLevelData.data, keysWithoutMeasure, keysWithoutMeasure);
        _.forOwn(attributeUniqObj, function (value, key) {
            let values = _.values(value);
            _.forEach(measures, function (msr) {
                values.push(measureUniqObj[key + '_' + msr]['value']);
            });
            result.resultData._data.push(values);
        });

        this.createUniqueLabelValues(result, currentLevelData, domainId);
        console.log(result);
        return result;
    };

    ReportMeasureResponse.prototype.createUniqueLabelValues = function (result, currentLevelData, domainId) {
        let valuesToExclued = ['data', 'measure', 'summaryresponse'];
        let uniqueValueKeys = _.filter(_.keys(currentLevelData), function (key) {
            return valuesToExclued.indexOf(key.toString().toLowerCase()) === -1;
        });
        let uniqueValues = _.pick(currentLevelData, uniqueValueKeys);
        _.forOwn(uniqueValues, function (attribUniqValues, attributeName) {
            let resultData = new ResultData();
            resultData.attribColumns = _.keys(attribUniqValues[0]);
            resultData._data = _.map(attribUniqValues, function (attribValues) {
                return _.values(attribValues)
            });
            _.each(resultData.attribColumns, function (attribColumn, index) {
                resultData.columnMap[attribColumn] = index;
            });

            let unqiueValue = new UnqiueValue();
            unqiueValue.resultData = resultData;
            unqiueValue.requestedAttrib = attributeName;
            unqiueValue.numOfRows = _.size(resultData._data);
            unqiueValue.domainId = domainId;
            result.uniqueLabelValues.push(unqiueValue);
        });
    };

    ReportMeasureResponse.prototype.saveSummary = function (dataObject, summary) {
        if (!_.get(dataObject, 'reportInfo.reportInfo.summarizeOnExec')) {
            return;
        }
        var mergedFormattedData = this.reportDataService.searchInMemory(dataObject, true);
        if (mergedFormattedData) {
            if (!mergedFormattedData.summaryResponse) {
                mergedFormattedData.summaryResponse = [];
            }
            mergedFormattedData.summaryResponse.push({
                outputFormat: dataObject.outputFormat,
                summary: summary,
                ruleBookId: _.get(dataObject, 'reportInfo.reportInfo.summarySettings.ruleBookId') || null
            });
        }
    };

    ReportMeasureResponse.prototype.isSummaryAvailable = function (summaryResponse, outputFormat, ruleBookId) {
        // let summaryResponseObj = _.find(summaryResponse, function (response) {
        //     return _.isEqual(response.outputFormat, outputFormat);
        // });
        let summaryResponseObj = _.find(summaryResponse, function (response) {
            return response.ruleBookId == ruleBookId;
        });
        // let summaryResponseObj = summaryResponse[0];
        return {
            isSummaryAvailable: summaryResponseObj ? true : false,
            summary: summaryResponseObj ? summaryResponseObj.summary : null
        };
    };

    return ReportMeasureResponse;
}());

exports.ReportMeasureResponse = ReportMeasureResponse;