"use strict";
exports.__esModule = true;
var report_data_merge_service_1 = require("./report-data-merge-service");
var Defaults = require('./defaults').defaults;
var report_data_transform_service_1 = require("./report-data-transform-service");
var report_data_filter_service = require("./report-data-filter-service");
var data_format_service = require("./report-data-format-service");
var additional_data_service = require("./report-additional-data-service");
var search_filter_service = require("./search-filter-service");
var MeasureAttributesEnum = require("./report-data-merge-service");
var common_utils_service = require("./common-utils-service");
var report_column_service = require("./report-column-service");
var disply_filter_service = require("./report-display-filter-service");
var nested_grid_service = require("./nested-grid-service");
var report_measure_response_service = require("./report-measure-response-service");
var ChartPropertiesService = require('./chart-defaults/chart-properties-service').ChartPropertiesService;
var ChartElementsService = require('./chart-defaults/chart-elements-defaults-mapping-service').ChartElementsDefaultsMappingService;
var _ = require("lodash");
var moment = require('moment');


var ReportDataService = (function () {

  function ReportDataService() {
    this.setDefaults();
    this.dataMergeService = new report_data_merge_service_1.ReportDataMergeService();
    this.transformService = new report_data_transform_service_1.ReportTranformDataService();
    this.filterService = new report_data_filter_service.ReportDataFilterService();
    this.formatService = new data_format_service.ReportDataFormatService();
    this.additionalDataService = new additional_data_service.ReportAdditionalDataService();
    this.searchFilterService = new search_filter_service.SearchFilterService();
    this.commonUtilsService = new common_utils_service.CommonUtilsService();
    this.reportColumnService = new report_column_service.ColumnService();
    this.displayFilterService = new disply_filter_service.DisplayFilterService();
    this.nestedGridService = new nested_grid_service.NestedGridService();
    this.measureResponseService = new report_measure_response_service.ReportMeasureResponse(this);
  }
  ReportDataService.prototype.setDefaults = function () {
    this.allLevelData = []; //This keyValPair: Key: Metadata & Value: Merged-Formatted Data & Unique values
    this.currentLevelIndex = -1; //This holds current level data index of above variable.
    this.reportMetaData = {};
    this.isValueConcatRequired = false;
    this.uniqueFilteredValues = [];
    this.isNestedReport = false;
    this.resetClientInfo();
  }

  ReportDataService.prototype.resetClientInfo = function () {
    this.appliedDisplayFiltersForUI = {};
    this.appliedSortInfoForUI = {};
    this.appliedPageFilters = [];
    this.appliedDisplayFilters = {};
    this.displayFiltersPassed = {};
    this.inputObject = {};
    this.sortedData = [];
    this.passedOutputFormat = {};
    this.nestedHierarchies = {};
    this.groupInfo = {};
    this.colorColumnFunctionRangeSet = {};
    this.logicalDsInfo = [];
    this.newAttribValObj = null;
    this.markerConditionKeys = [];
    this.passedColumnOptions = null;
    this.defaultSortInfo = null;
    this.nestedSortInfo = null;
  }

  ReportDataService.prototype.clearData = function () {
    this.setDefaults();
  }
  ReportDataService.prototype.fetchData = function (dataObject, additionalInfo, skipTopLevelReset) {
    console.time('rdsData');
    dataObject = this.modifyDataObject(dataObject);
    this.resetClientInfo();
    this.inputObject = dataObject;
    this.defaultSortInfo;
    let defaultSortColumnAttribute;
    this.reportMetaData = dataObject.reportInfo;
    this.createLogicalDsInfo(dataObject.reportInfo);
    var allAttribsDataItemMap = dataObject.allAttribsDataItemMap;
    let isMainVisual = dataObject.isMainVisual;
    this.groupInfo = dataObject.groupInfo;
    this.passedColumnOptions = _.cloneDeep(dataObject.columnOptions);
    // this.createGroupInfo(allAttribsDataItemMap);
    let newAttribMsrValObj = this.createUniqueValsObjForNewAttribVals(this.reportMetaData, dataObject.groupInfo);
    let uniqObj = newAttribMsrValObj.uniqObj;
    this.newAttribValObj = _.size(newAttribMsrValObj.newAttribValObj) ? newAttribMsrValObj.newAttribValObj : null;
    if (_.has(dataObject, ['reportInfo', 'reportInfo', 'dsFunctions', 'logicalDSFunctions'])) {
      this.markerConditionKeys = _.map(_.filter(dataObject.reportInfo.reportInfo.dsFunctions.logicalDSFunctions, function (dsFunction) {
        return dsFunction.uiInfos.isMarkerColorSelected;
      }), function (markerDsFunction) {
        return markerDsFunction.key;
      });
    }
    let columnOptions = dataObject.columnOptions;
    var outputFormat = dataObject.outputFormat;
    let hierarchies = this.reportMetaData.reportInfo.hierarchies;
    this.nestedHierarchies = this.getNestedHierarchies(hierarchies);
    if (!_.isEmpty(this.nestedHierarchies)) {
      this.isNestedReport = true;
      this.isValueConcatRequired = true;
    }
    let topxInfo = columnOptions.topXInfo && !_.isEmpty(columnOptions.topXInfo) ? columnOptions.topXInfo : null;
    var mergedFormattedData = this.searchInMemory(dataObject, true);
    if (mergedFormattedData === null) {
      let self = this;
      var resultData = this.inputObject.resultData;
      self.updateGroupDetailsInResultData(resultData);
      if (_.size(dataObject.customKpiInfo) && this.inputObject.resultData.resultData && _.size(this.inputObject.resultData.resultData.measureColumns)) {

        dataObject.customKpiInfo = dataObject.customKpiInfo.filter(function (x) {
          return self.inputObject.resultData.resultData.measureColumns.indexOf(x.key) === -1
        });
        Array.prototype.push.apply(this.inputObject.resultData.kpiDetails, dataObject.customKpiInfo);
      }
      var mergedData = this.mergeServiceData(this.inputObject.resultData, uniqObj, allAttribsDataItemMap, this.nestedHierarchies, this.groupInfo); //Merge id and name values
      var summary = this.inputObject.resultData.reportSummary;
      this.inputObject.resultData = {};
      mergedFormattedData = this.formatMergedDataValues(mergedData, allAttribsDataItemMap); //Format merged data
      if (this.nestedGridService.checkForNested(this.nestedHierarchies)) {
        let nestedData = this.nestedGridService.prepareNestedData(this.nestedHierarchies, mergedFormattedData, outputFormat, dataObject, this);
        if (!additionalInfo || (additionalInfo && !additionalInfo.isRowColumnDataRequired)) {
          mergedFormattedData = nestedData.mergedFormattedData;
          outputFormat = nestedData.outputFormat;
        }
      } else {
        var dataLevel = {
          metaData: _.cloneDeep(dataObject),
          data: mergedFormattedData
        };
        this.allLevelData.push(dataLevel); //Push merged formatted data into memory
        this.currentLevelIndex = this.allLevelData.length - 1;
      }
      this.saveSummary(this.inputObject, summary);
    }
    if ((this.nestedGridService.checkForNested(this.nestedHierarchies) && _.isEmpty(dataObject.nestedFilters) && !skipTopLevelReset)) {
      let tempReqObj = this.nestedGridService.resetNestedInfo(dataObject, this.nestedHierarchies);
      mergedFormattedData = this.searchInMemory(tempReqObj);
      let currentLevel = this.getCurrentLevelData();
      outputFormat.groupedAttrs = currentLevel.metaData.outputFormat.groupedAttrs;
    }
    if (!_.isEmpty(dataObject.nestedFilters) && this.nestedGridService.checkForNested(this.nestedHierarchies)) {
      delete mergedFormattedData.topInfoData;
    }
    let topFormattedData;
    if ((topxInfo && !mergedFormattedData.topInfoData) || (topxInfo && mergedFormattedData.topInfoData && !_.isEqual(mergedFormattedData.topInfoData.topxInfo, topxInfo)) ||
      (isMainVisual && topxInfo && mergedFormattedData.topInfoData && !_.isEqual(mergedFormattedData.topInfoData.outputFormat, outputFormat))) {
      let mainVisualOutputFormat = this.inputObject.mainVisualOutputFormat || outputFormat;
      let topData = this.getTopData(topxInfo, mergedFormattedData, allAttribsDataItemMap, mainVisualOutputFormat, dataObject.nestedFilters);
      topFormattedData = topData;
      let topInfoData = {
        topxInfo: topxInfo,
        topData: topData,
        outputFormat: outputFormat
      };
      this.allLevelData[this.currentLevelIndex].data.topInfoData = topInfoData;
    } else if (topxInfo && mergedFormattedData.topInfoData && mergedFormattedData.topInfoData.topxInfo && _.isEqual(mergedFormattedData.topInfoData.topxInfo, topxInfo)) {
      topFormattedData = mergedFormattedData.topInfoData.topData;
    }
    if (topFormattedData) {
      topFormattedData = _.extend(topFormattedData, _.omit(mergedFormattedData, 'data'));
    }
    topFormattedData = topFormattedData || mergedFormattedData;
    this.updateNewAttribValObj(topFormattedData, allAttribsDataItemMap);
    this.passedOutputFormat = _.cloneDeep(outputFormat);
    let dataToTransform = topFormattedData;
    if (dataObject.filters) {
      this.displayFiltersPassed = _.cloneDeep(dataObject.filters.displayFilters);
      if (columnOptions && !_.isEmpty(columnOptions.sortInfo)) {
        // outputFormat = this.displayFilterService.updateFormatForDisplayFilters(this.displayFiltersPassed, columnOptions.sortInfo, outputFormat, allAttribsDataItemMap);
      }
      dataToTransform = this.prepareDataToTransform(topFormattedData, dataObject.filters, outputFormat, true, dataObject.nestedFilters);
    }
    return this.prepareFinalData(topFormattedData, dataToTransform, outputFormat, allAttribsDataItemMap, columnOptions, additionalInfo, dataObject.filters && dataObject.filters.displayFilters);
  };


  ReportDataService.prototype.updateGroupDetailsInResultData = function (resultData) {
    let _this = this;
    let groupLabels = _.filter(resultData.labelDetails, function (label) {
      return label.labelType === Defaults.labelTypes.groupLabel;
    });
    let uniqueLabelValues = resultData.uniqueLabelValues;
    if (_.size(groupLabels) && _.size(uniqueLabelValues)) {
      _.forEach(groupLabels, function (groupLabel) {
        let groupId = groupLabel.attribGId;
        _.some(resultData.resultData.attribColumns, function (attribColumn, index) {
          if (attribColumn.toString() === groupId.toString()) {
            resultData.resultData.attribColumns[index] = groupLabel.name;
            return true;
          }
        });
        resultData.resultData.columnMap[groupLabel.name] = resultData.resultData.columnMap[groupId];
        delete resultData.resultData.columnMap[groupId];
        let currentUniqueLableValue = _.find(uniqueLabelValues, function (uniqueLabelValue) {
          return uniqueLabelValue.requestedAttrib.toString() === groupId.toString();
        });
        if (currentUniqueLableValue) {
          currentUniqueLableValue.requestedAttrib = groupLabel.name;
          _.each(currentUniqueLableValue.resultData.attribColumns, function (attribColumn, index) {
            if (attribColumn.toString() === groupId.toString()) {
              // currentUniqueLableValue.resultData.attribColumns[index] = groupLabel.name;
              currentUniqueLableValue.resultData.attribColumns.push(groupLabel.name);
            }
            if (attribColumn.toString() === groupId + Defaults.defaultNameProperty.toString()) {
              // currentUniqueLableValue.resultData.attribColumns[index] = groupLabel.name + Defaults.defaultNameProperty;
              currentUniqueLableValue.resultData.attribColumns.push(groupLabel.name + Defaults.defaultNameProperty);
            }
          });

          currentUniqueLableValue.resultData.columnMap[groupLabel.name] = currentUniqueLableValue.resultData.columnMap[groupId];
          currentUniqueLableValue.resultData.columnMap[groupLabel.name + Defaults.defaultNameProperty] = currentUniqueLableValue.resultData.columnMap[groupId + Defaults.defaultNameProperty];
          // delete currentUniqueLableValue.resultData.columnMap[groupId];
          // delete currentUniqueLableValue.resultData.columnMap[groupId + Defaults.defaultNameProperty];
        }
      });
    }
  };

  ReportDataService.prototype.createGroupInfo = function (allAttribsDataItemMap) {
    let _this = this;
    _.forOwn(allAttribsDataItemMap, function (values, key) {
      if (key.length === parseInt(key).toString().length && parseInt(key) !== NaN) {
        _this.groupInfo[values.idDataItems[0].description] = key;
      }
    });
  };

  ReportDataService.prototype.createLogicalDsInfo = function (reportInfo) {
    let _this = this;
    if (_.has(reportInfo, 'reportInfo.dsFunctions.logicalDSFunctions') && _.size(reportInfo.reportInfo.dsFunctions.logicalDSFunctions) > 0) {
      _.forEach(reportInfo.reportInfo.dsFunctions.logicalDSFunctions, function (logicalDsFunction) {
        if (logicalDsFunction.uiInfos.conditionType === Defaults.colorConditionsEnum.showHide) {
          _this.logicalDsInfo.push({
            conditionKey: logicalDsFunction.key,
            isHide: logicalDsFunction.uiInfos.isHideCells
          });
        }
      });
    }
  };

  ReportDataService.prototype.updateNewAttribValObj = function (uniqueValsObj, allAttribsDataItemMap) {
    let _this = this;
    _.forOwn(_this.newAttribValObj, function (newAttributeValues, attribute) {
      if (attribute && allAttribsDataItemMap[attribute]) {
        let idItemNames = _.map(allAttribsDataItemMap[attribute].idDataItems, function (idDataItem) {
          return idDataItem.name;
        });
        let unqiueValuesForCurrentAttribute = uniqueValsObj[attribute];
        _.each(newAttributeValues, function (value, key) {
          let currentValue = _.pick(value, idItemNames);
          let currentValueInUniqueValues = _.find(unqiueValuesForCurrentAttribute, function (uniqueValue, index) {
            return _.isEqual(_.pick(uniqueValue, idItemNames), currentValue);
          });
          _this.newAttribValObj[attribute][key] = currentValueInUniqueValues;
        });
      }
    });
  };

  ReportDataService.prototype.createUniqueValsObjForNewAttribVals = function (reportInfo, groupInfo) {
    let uniqObj = {};
    let newAttribValObj = {};
    let _this = this;
    if (reportInfo.reportInfo && reportInfo.reportInfo.dsFunctions && _.size(reportInfo.reportInfo.dsFunctions.newAttribMsrDSFunctions) > 0) {
      let newAttribValsInfo = reportInfo.reportInfo.dsFunctions.newAttribMsrDSFunctions.filter(function (x) {
        return x.newAttribMsrVals.type.type == 1 || x.newAttribMsrVals.type.type == 2;
      });

      _.each(newAttribValsInfo, function (newAttribValInfo) {
        let name = newAttribValInfo.newAttribMsrVals.type.name;
        if (groupInfo[name]) {
          name = groupInfo[name];
        }
        if (!uniqObj.hasOwnProperty(name)) {
          uniqObj[name] = {};
          uniqObj[name][newAttribValInfo.newAttribMsrVals.key] = newAttribValInfo.newAttribMsrVals.name;
        } else {
          uniqObj[name][newAttribValInfo.newAttribMsrVals.key] = newAttribValInfo.newAttribMsrVals.name;
        }
        if (!newAttribValObj.hasOwnProperty(name)) {
          if (newAttribValInfo.uiInfos && newAttribValInfo.uiInfos.timeSortValue) {
            newAttribValObj[name] = {};
            newAttribValObj[name][newAttribValInfo.newAttribMsrVals.key] = newAttribValInfo.uiInfos.timeSortValue;
          }
        } else {
          newAttribValObj[name][newAttribValInfo.newAttribMsrVals.key] = newAttribValInfo.uiInfos.timeSortValue;
        }
      });
    }
    return {
      uniqObj: {},
      newAttribValObj: newAttribValObj
    };
  };

  ReportDataService.prototype.getSummaryOrMeasureResponse = function (dataObject) {
    return this.measureResponseService.getSummaryOrMeasureResponse(dataObject);
  };

  ReportDataService.prototype.saveSummary = function (dataObject, summary) {
    this.measureResponseService.saveSummary(dataObject, summary);
  }

  ReportDataService.prototype.addFiltersInfoToOutput = function (finalData) {
    finalData.appliedDisplayFilters = this.appliedDisplayFilters;
    finalData.appliedPageFilters = this.appliedPageFilters;
    finalData.appliedDisplayFiltersForUI = this.appliedDisplayFiltersForUI;
  };

  ReportDataService.prototype.isDataAvailable = function (reportInfo) {
    reportInfo = this.modifyDataObject(reportInfo);
    var mergedFormattedData = this.searchInMemory(reportInfo);
    return (mergedFormattedData === null) ? false : true;
  };
  ReportDataService.prototype.getSearchResults = function (data, searchList, searchLogicalCondition) {
    return this.reportColumnService.getSearchResults(data, searchList, searchLogicalCondition);
  };
  ReportDataService.prototype.applyFilters = function (data, filters, outputFormat, validationRequired) {
    this.appliedDisplayFilters = validationRequired ? {} : this.appliedDisplayFilters;
    let currentLevel = this.getCurrentLevelData();
    let allAttribsDataItemMap = currentLevel.metaData.allAttribsDataItemMap;
    this.createDisplayFilters(data, filters.displayFilters, allAttribsDataItemMap);
    let displayFilteredData = [];
    if (this.appliedDisplayFilters && Object.keys(this.appliedDisplayFilters).length) {
      displayFilteredData = this.applyDisplayFilters(this.appliedDisplayFilters, outputFormat, data.data);
    } else {
      displayFilteredData = data.data;
    }
    if (validationRequired) {
      this.appliedPageFilters = [];
      this.validateFilters(data, filters, outputFormat);
    }
    let finaldata = displayFilteredData;
    if (_.size(outputFormat.pages)) {
      let mergedPfilters = [];
      let pages = outputFormat.pages;
      let mergedFormattedData = this.getCurrentLevelData();
      let pageIdItems = _.map(_.flattenDeep(_.map(_.values(_.pick(allAttribsDataItemMap, pages)), 'idDataItems')), 'name');
      _.forEach(this.appliedPageFilters, function (pf) {
        mergedPfilters.push(_.pick(pf, pageIdItems));
      });
      finaldata = this.applyFiltersOnData(displayFilteredData, mergedPfilters, outputFormat);
    }
    return finaldata;
  };

  ReportDataService.prototype.getDataItems = function (attributeName) {
    let currentLevel = this.getCurrentLevelData();
    let allAttribsDataItemMap = currentLevel.metaData.allAttribsDataItemMap;
    return allAttribsDataItemMap[attributeName];
  }

  ReportDataService.prototype.validateFilters = function (mergedFormattedData, filters, outputFormat) {
    //Check if page filters exists
    //If this is time attribute & No page filter available then
    //do we need to sort and apply first page filter??
    let _this = this;
    let pageFilteredData = [];
    let pagesWithoutFilters = _.cloneDeep(outputFormat.pages);
    if (filters.pageFilters && filters.pageFilters.length > 0) {
      _.forEach(filters.pageFilters, function (pf, index) {
        let pageFilterIds = _.keys(pf);
        let key;
        _.each(outputFormat.pages, function (page) {
          let idDataItems = _.map(_this.getDataItems(page).idDataItems, function (x) {
            return x.name;
          });
          if (_.isEqual(pageFilterIds, idDataItems)) {
            key = page;
            pagesWithoutFilters = _.difference(pagesWithoutFilters, [page]);
          }
        });
        if (!key) {
          return;
        }
        let idDataItems = _.map(_this.getDataItems(key).idDataItems, function (x) {
          return x.name;
        });
        let paged = _.find(mergedFormattedData[key], function (val) {
          return _.isEqual(pf, _.pick(val, idDataItems));
        });
        let uniqueValues = _.map(mergedFormattedData[key], function (x) {
          return _.pick(x, idDataItems);
        });
        if (_.size(_this.appliedDisplayFilters[key]) > 0 && _this.appliedDisplayFilters[key].length > 0 && _.intersectionWith([_.pick(paged, idDataItems)], _this.appliedDisplayFilters[key], _.isEqual).length === 0) {
          paged = _this.commonUtilsService.getIntersectedValues(mergedFormattedData[key], _this.appliedDisplayFilters[key], idDataItems)[0];
        }
        if (!paged && mergedFormattedData[key].length > 0) {
          if (_.size(_this.appliedDisplayFilters) > 1 && _this.appliedDisplayFilters[key]) {
            var displayFiltersAvailableInData = _.intersectionWith(uniqueValues, _this.appliedDisplayFilters[key], _.isEqual);
            if (_.size(displayFiltersAvailableInData)) {
              paged = displayFiltersAvailableInData[0];
            } else {
              paged = mergedFormattedData[key][0];
            }
          } else {
            paged = mergedFormattedData[key][0];
          }
        }
        _this.appliedPageFilters.push(paged);
      });
    }
    if (pagesWithoutFilters.length > 0) {
      _.each(pagesWithoutFilters, function (page, index) {
        let currentPageDisplayFilters = filters.displayFilters && filters.displayFilters[page];
        if (currentPageDisplayFilters) {
          let currentPageData = _.cloneDeep(mergedFormattedData[page]);
          let idDataItems = _.map(_this.getDataItems(page).idDataItems, function (idDataItem) {
            return idDataItem.name
          });
          if (_.size(currentPageDisplayFilters.hiddenValues)) {
            currentPageData = _.differenceWith(currentPageData, currentPageDisplayFilters.hiddenValues, function (a, b) {
              return _.isEqual(_.pick(a, idDataItems), _.pick(b, idDataItems));
            });
          }
          if (_.size(currentPageDisplayFilters.showValues)) {
            currentPageData = _.intersectionWith(currentPageData, currentPageDisplayFilters.showValues, function (a, b) {
              return _.isEqual(_.pick(a, idDataItems), _.pick(b, idDataItems));
            });
          }
          if (_.size(currentPageData)) {
            pageFilteredData.push(currentPageData[0]);
          }
        } else {
          pageFilteredData.push(mergedFormattedData[page][0]);
        }
      });
      _this.appliedPageFilters = _.concat(_this.appliedPageFilters, pageFilteredData);
    }
  }

  ReportDataService.prototype.createDisplayFilters = function (mergedFormattedData, displayFilters, allAttribsDataItemMap) {
    let displayFilterInfo = this.displayFilterService.createDisplayFilters(mergedFormattedData, displayFilters, allAttribsDataItemMap);
    this.appliedDisplayFilters = displayFilterInfo.appliedDisplayFilters;
    this.appliedDisplayFiltersForUI = displayFilterInfo.appliedDisplayFiltersForUI;
  };

  ReportDataService.prototype.applyDisplayFilters = function (displayFilters, outputFormat, data) {
    let mergedFormattedData = this.getCurrentLevelData();
    let displayFilteredData = data ? _.cloneDeep(data) : _.cloneDeep(mergedFormattedData.data.data);
    let attributes = _.reverse(_.concat([], outputFormat.rows, outputFormat.columns, outputFormat.pages, outputFormat.gridRows, outputFormat.gridColumns));
    attributes = _.intersectionWith(attributes, outputFormat.groupedAttrs);
    var _this = this;
    _.forEach(attributes, function (key) {
      if (displayFilters[key]) {
        displayFilteredData = _this.applyFiltersAtCurrentLevelData(displayFilters[key], displayFilteredData);
      }
    });
    return displayFilteredData;
  };

  ReportDataService.prototype.applyFiltersOnData = function (data, filters) {
    var _this = this;
    let filteredData = data;
    if (filters && filters.length > 0) {
      _.each(filters, function (filter) {
        filteredData = _this.filterService.getFilteredData(filteredData, filter);
      });
    }
    return filteredData;
  };

  ReportDataService.prototype.applyFiltersAtCurrentLevelData = function (filters, data) {
    let filteredData = this.filterService.filterData(data, filters);
    return filteredData;
  };

  ReportDataService.prototype.getCurrentLevelData = function () {
    if (this.currentLevelIndex === -1) {
      throw Error("There is no data available for this report.");
    }
    this.reportMetaData = this.allLevelData && this.allLevelData[this.currentLevelIndex] && this.allLevelData[this.currentLevelIndex].metaData;
    return this.allLevelData && this.allLevelData[this.currentLevelIndex];
  };

  ReportDataService.prototype.prepareDataToTransform = function (mergedFormattedData, filters, outputFormat, isValidationRequired, nestedFilters) {
    let dataToTransform = {};
    let filteredData = this.applyFilters(mergedFormattedData, filters, outputFormat, isValidationRequired);
    if (nestedFilters) {
      filteredData = this.filterService.getFilteredData(filteredData, nestedFilters);
    }
    dataToTransform = {
      "data": filteredData
    };
    _.forEach(Object.keys(mergedFormattedData), function (key) {
      if (key != "data") {
        dataToTransform[key] = _.cloneDeep(mergedFormattedData[key]);
      }
    });
    return dataToTransform;
  };

  ReportDataService.prototype.addLogicalDsInfoToOutput = function (finalData, data, allAttribsDataItemMap) {
    let logicalDsInfo = [];
    let _this = this;
    let rowColIdItems = [];
    let rowsAndColumns = _.intersection(_.concat(this.passedOutputFormat.gridRows, this.passedOutputFormat.gridColumns, this.passedOutputFormat.rows, this.passedOutputFormat.columns), this.passedOutputFormat.groupedAttrs);
    _.each(rowsAndColumns, function (attr) {
      let idDataItems = _.map(allAttribsDataItemMap[attr].idDataItems, function (x) {
        return x.name;
      });
      rowColIdItems = _.concat(rowColIdItems, idDataItems);
    });
    let cols = this.passedOutputFormat.columns;
    let colIdItems = [];
    _.each(cols, function (attr) {
      let idDataItems = _.map(allAttribsDataItemMap[attr].idDataItems, function (x) {
        return x.name;
      });
      colIdItems = _.concat(colIdItems, idDataItems);
    });
    let logicalDsObj = this.transformService.createUniqueObj(data, rowColIdItems);
    let tempObj = {};
    let dsColObj = {};
    _.forOwn(logicalDsObj, function (value, key) {
      if (value.logicalDs) {
        let currentMeasure = value[MeasureAttributesEnum.MeasureAttributeEnum.Name];
        let validFunctions = value.logicalDs.ValidFunctions || {};
        validFunctions = _.pick(validFunctions, currentMeasure);
        if (value.logicalDs.ValidFunctions) {
          value.logicalDs.ValidFunctions = validFunctions;
        }
        tempObj[key] = value.logicalDs;
        let colKey = _.join(_.values(_.pick(value, colIdItems)), '_') || 'value';
        if (!_.has(dsColObj, colKey)) {
          if (value.logicalDs.ValidFunctions) {
            _.forOwn(value.logicalDs.ValidFunctions, function (value, key) {
              if (key === currentMeasure) {
                _.forOwn(value, function (conditionValue, conditionKey) {
                  if (_this.markerConditionKeys.indexOf(conditionKey) > -1) {
                    dsColObj[colKey] = null;
                  }
                });
              }
            });
          }
        }
      }
    });
    finalData.logicalDsInfo = tempObj;
    finalData.logicalDsColInfo = _.keys(dsColObj);
  };

  ReportDataService.prototype.getTopData = function (topxInfo, mergedFormattedData, allAttribsDataItemMap, outputFormat, nestedFilters) {
    let topInfoData = {};
    let _this = this;
    let allIdItems = [];
    _.each(_.concat(outputFormat.rows, outputFormat.columns, outputFormat.pages, outputFormat.gridRows, outputFormat.gridColumns), function (attr) {
      if (allAttribsDataItemMap[attr]) {
        let idDataItems = _.map(allAttribsDataItemMap[attr].idDataItems, function (x) {
          return x.name;
        });
        allIdItems = _.concat(allIdItems, idDataItems);
      }
    });
    if (topxInfo) {
      let pageAttributes = outputFormat.pages;
      let pageIdItems = [];
      _.each(pageAttributes, function (attr) {
        if (allAttribsDataItemMap[attr]) {
          let idDataItems = _.map(allAttribsDataItemMap[attr].idDataItems, function (x) {
            return x.name;
          });
          pageIdItems = _.concat(pageIdItems, idDataItems);
        }
      });
      let pageCombinations = _this.commonUtilsService.cartesianProdOfArrOfObjs(_.values(_.pick(mergedFormattedData, pageAttributes)));
      console.log(pageCombinations);
      topInfoData = _.cloneDeep(mergedFormattedData);
      let topFinalData = [];
      if (_.size(pageCombinations) === 0) {
        pageCombinations.push({});
      }

      for (var pageCombinationIndex = 0; pageCombinationIndex < _.size(pageCombinations); pageCombinationIndex++) {
        var pageCombination = pageCombinations[pageCombinationIndex];
        let topFilterObj = _.pick(pageCombination, pageIdItems);
        let filteredData = topInfoData.data;
        let topObjData = _this.filterService.getFilteredData(filteredData, _.assign(topFilterObj, topxInfo.topxObject, nestedFilters));
        topObjData = _.filter(topObjData, function (record) {
          if (record['value']) {
            return true;
          }
        });
        let values = _.uniq(_.map(topObjData, function (record) {
          return record['value'];
        }));
        let topValues = _.slice(_.orderBy(values, function (x) {
          return x;
        }, topxInfo.topType === 'top' ? 'desc' : 'asc'), 0, topxInfo.topValue);
        let topData = _.filter(topObjData, function (record) {
          return _.indexOf(topValues, record['value']) !== -1;
        });
        let topRecords = _.map(topData, function (record) {
          let propsToOmit = _.concat(_.keys(topxInfo.topxObject), 'value');
          let propsToPick = _.difference(allIdItems, propsToOmit);
          let tempRecord = _.pick(record, propsToPick);
          return tempRecord;
        });
        let tempData = [];
        for (var topRecordIndex = 0; topRecordIndex < _.size(topRecords); topRecordIndex++) {
          let topRecord = topRecords[topRecordIndex];
          let tempTopRecords = _this.filterService.getFilteredData(topInfoData.data, topRecord);
          tempData = _.concat(tempData, tempTopRecords);
        }
        topFinalData = _.concat(topFinalData, tempData);
      }
      topInfoData.data = topFinalData;
    }
    return topInfoData;
  }

  ReportDataService.prototype.prepareFinalData = function (mergedData, dataToTransform, outputFormat, allAttribsDataItemMap, columnOptions, additionalInfo, displayFilters) {
    let finalData = {};
    dataToTransform.data = this.applyLogicalDs(dataToTransform.data);
    _.forEach(Object.keys(mergedData), function (key) {
      if (key != "data") {
        finalData[key] = _.cloneDeep(mergedData[key]);
      }
    });
    if (_.size(dataToTransform.data) > 0 && dataToTransform.data[0].hasOwnProperty('logicalDs')) {
      this.addLogicalDsInfoToOutput(finalData, dataToTransform.data, allAttribsDataItemMap);
    }
    this.addFiltersInfoToOutput(finalData);
    if (additionalInfo) {
      this.getAdditionalData(additionalInfo, finalData, dataToTransform, outputFormat, allAttribsDataItemMap, columnOptions);
    }
    if ((additionalInfo && additionalInfo.hasOwnProperty('isDataRequired') && additionalInfo.isDataRequired && _.size(finalData.data) === 0) || !additionalInfo) {
      _.assign(finalData, this.transformColFuncPrepareClientData(dataToTransform, outputFormat, allAttribsDataItemMap, columnOptions, displayFilters));
      if (finalData && finalData.hasOwnProperty('additionalData')) {
        if (_.size(finalData.additionalData.rowVals) > 0) {
          finalData.additionalData.rowVals = this.commonUtilsService.getIntersectedValues(finalData.additionalData.rowVals, finalData.data, [finalData.additionalData.rowName]);
        }
        this.applyDefaultSortingForAdditionalDataCols(finalData, outputFormat, allAttribsDataItemMap, displayFilters);
      }
    }
    finalData.appliedSortInfoForUI = this.appliedSortInfoForUI;
    finalData.defaultSortInfo = this.defaultSortInfo;
    finalData.colorColumnRangeSet = this.colorColumnFunctionRangeSet;
    // console.log(finalData);
    console.log('for ' + (finalData.data && finalData.data.length || 'no') + ' records');
    console.timeEnd('rdsData');
    this.applyDefaultSortingForGridData(finalData, outputFormat, allAttribsDataItemMap, displayFilters);
    // this.getRowAttributesDisplayOrder(finalData, outputFormat, allAttribsDataItemMap);
    return finalData;
  };

  ReportDataService.prototype.applyDefaultSortingForAdditionalDataCols = function (finalData, outputFormat, allAttribsDataItemMap, displayFilters) {
    let _this = this;
    if (_.size(finalData.additionalData.colVals)) {
      let columns = outputFormat.columns;
      let dataColumnProps = [];
      let displayFiltersPassed = [];
      let measureVals = _.map(finalData[MeasureAttributesEnum.MeasureAttributeEnum.Name], function (val) {
        return _.pick(val, MeasureAttributesEnum.MeasureAttributeEnum.Name)
      });
      _.each(columns, function (column) {
        dataColumnProps.push(_.map(allAttribsDataItemMap[column].idDataItems, function (idDataItem) {
          return idDataItem.name
        }));
        if (displayFilters[column] && _.size(displayFilters[column].orderedValues) > 0) {
          if (column === MeasureAttributesEnum.MeasureAttributeEnum.Name) {
            displayFiltersPassed.push(_.unionWith(displayFilters[column].orderedValues, measureVals, _.isEqual));
          } else {
            displayFiltersPassed.push(displayFilters[column].orderedValues);
          }
        } else {
          if (column === MeasureAttributesEnum.MeasureAttributeEnum.Name) {
            displayFiltersPassed.push(measureVals);
          } else {
            displayFiltersPassed.push([]);
          }
        }
      });
      finalData.additionalData.colVals = _this.reportColumnService.getSortedDataInOrder(finalData.additionalData.colVals, dataColumnProps, columns, null, null, allAttribsDataItemMap, _this.newAttribValObj, null, displayFiltersPassed);
    }
  };

  ReportDataService.prototype.applyDefaultSortingForGridData = function (finalData, outputFormat, allAttribsDataItemMap, displayFilters) {
    if (_.size(finalData.gridData)) {
      let _this = this;
      let gridRows = outputFormat.gridRows;
      let gridCols = outputFormat.gridColumns;
      let dataColumnProps = [];
      let displayFiltersPassed = [];
      if (_.size(finalData.additionalData.colVals)) {
        _this.applyDefaultSortingForAdditionalDataCols(finalData, outputFormat, allAttribsDataItemMap, displayFilters);
      }
      _.each(gridRows, function (gridRow) {
        dataColumnProps.push(_.map(allAttribsDataItemMap[gridRow].idDataItems, function (idDataItem) {
          return idDataItem.name
        }));
        if (displayFilters[gridRow] && _.size(displayFilters[gridRow].orderedValues) > 0) {
          displayFiltersPassed.push(displayFilters[gridRow].orderedValues);
        } else {
          displayFiltersPassed.push([]);
        }
      });

      finalData.gridData = _this.reportColumnService.getSortedDataInOrder(finalData.gridData, dataColumnProps, gridRows, null, null, allAttribsDataItemMap, _this.newAttribValObj, ['rowVal'], displayFiltersPassed);
      // let displayOrderedGridRows = [];
      // let displayFilterAttributeProps = [];
      // let displayFiltersPassed = [];
      // _.each(gridRows, function (gridRow) {
      //   if (displayFilters[gridRow] && _.size(displayFilters[gridRow].orderedValues) > 0) {
      //     displayOrderedGridRows.push(gridRow);
      //     displayFilterAttributeProps.push(_.map(allAttribsDataItemMap[gridRow].idDataItems, function (idDataItem) {
      //       return idDataItem.name
      //     }));
      //     displayFiltersPassed.push(displayFilters[gridRow].orderedValues);
      //   }
      // });
      // finalData.gridData = _this.reportColumnService.getSortedData(finalData.gridData, displayFilterAttributeProps, _.difference(gridRows, displayOrderedGridRows), null, null, allAttribsDataItemMap, _this.newAttribValObj, ['rowVal'], displayFiltersPassed);
      // let displayOrderedGridCols = [];
      // _.each(gridCols, function (gridCol) {
      //   if (displayFilters[gridCol] && _.size(displayFilters[gridCol].orderedValues) > 0) {
      //     displayOrderedGridCols.push(gridCol);
      //     displayFilterAttributeProps.push(_.map(allAttribsDataItemMap[gridCol].idDataItems, function (idDataItem) {
      //       return idDataItem.name
      //     }));
      //     displayFiltersPassed.push(displayFilters[gridCol].orderedValues);
      //   }
      // });
      displayFiltersPassed = [];
      _.each(gridCols, function (gridCol) {
        dataColumnProps.push(_.map(allAttribsDataItemMap[gridCol].idDataItems, function (idDataItem) {
          return idDataItem.name
        }));
        if (displayFilters[gridCol] && _.size(displayFilters[gridCol].orderedValues) > 0) {
          displayFiltersPassed.push(displayFilters[gridCol].orderedValues);
        } else {
          displayFiltersPassed.push([]);
        }
      });
      _.each(finalData.gridData, function (row) {
        row.cols = _this.reportColumnService.getSortedDataInOrder(row.cols, dataColumnProps, gridCols, null, null, allAttribsDataItemMap, _this.newAttribValObj, ['colVal'], displayFiltersPassed);
      });
    }
  };

  ReportDataService.prototype.applyLogicalDs = function (data) {
    let _this = this;
    let tempData = data;
    if (_.size(_this.logicalDsInfo)) {
      _.forEach(_this.logicalDsInfo, function (condition) {
        tempData = _.filter(tempData, function (record) {
          if (_.has(record, 'logicalDs')) {
            let validFunctions = _.has(record.logicalDs, 'ValidFunctions') ? record.logicalDs.ValidFunctions : null;
            if (validFunctions && validFunctions[record[MeasureAttributesEnum.MeasureAttributeEnum.Name]]) {
              let conditionsSatisfied = _.keys(validFunctions[record[MeasureAttributesEnum.MeasureAttributeEnum.Name]]);
              if (conditionsSatisfied.length === 0) {
                return condition.isHide ? true : false;
              } else if (conditionsSatisfied.indexOf(condition.conditionKey) !== -1) {
                return condition.isHide ? false : true;
              } else {
                return condition.isHide ? true : false;
              }
            } else {
              return condition.isHide;
            }
          } else {
            return true;
          }
        });
      });
    }
    return tempData;
  };

  ReportDataService.prototype.getRowAttributesDisplayOrder = function (finalData, outputFormat, allAttribsDataItemMap) {
    for (let i = 0; i < outputFormat.rows.length; i++) {
      let currentRowAttribute = outputFormat.rows[i];
      let idItemNames = _.map(allAttribsDataItemMap[currentRowAttribute].idDataItems, 'name');
      let currentRowAttributeData = _.uniq(_.map(finalData.data, function (record) {
        return _.pick(record, idItemNames)
      }));

      finalData[currentRowAttribute] = this.commonUtilsService.mapOrder(finalData[currentRowAttribute], currentRowAttributeData, idItemNames);
      let currentLevel = this.getCurrentLevelData();
      currentLevel.data[currentRowAttribute] = finalData[currentRowAttribute];
      // this.allLevelData[this.currentLevelIndex].data[currentRowAttribute] = finalData[currentRowAttribute];
      console.log(currentRowAttributeData);
    }
  };

  ReportDataService.prototype.getNestedHierarchies = function (hierarchies) {
    let nestedHierarchies = {};
    _.each(hierarchies, function (hierarchy) {
      if (hierarchy.hierarchyType == 2) {
        nestedHierarchies[hierarchy.key] = hierarchy;
      }
    });
    return nestedHierarchies;
  };

  ReportDataService.prototype.searchInMemory = function (sourceReportInfo) {
    sourceReportInfo = _.cloneDeep(sourceReportInfo);
    var _this = this;
    var data = null;
    if (this.currentLevelIndex > -1) {
      data = this.allLevelData.find(function (criteria, index) {
        if (_this.isCriteriaMatch(criteria, sourceReportInfo)) {
          _this.currentLevelIndex = index;
          return true;
        }
      });
      data = data ? data.data : null;
    }
    return data;
  };

  ReportDataService.prototype.getMetaData = function (sourceReportInfo) {
    sourceReportInfo = _.cloneDeep(sourceReportInfo);
    var _this = this;
    var data = null;
    if (this.currentLevelIndex > -1) {
      data = this.allLevelData.find(function (criteria, index) {
        if (_this.isCriteriaMatch(criteria, sourceReportInfo)) {
          _this.currentLevelIndex = index;
          return true;
        }
      });
      data = data ? data.metaData : null;
    }
    return data;
  };

  ReportDataService.prototype.transformColFuncPrepareClientData = function (mergedFormattedData, outputFormat, allAttribsDataItemMap, columnOptions, displayFilters) {
    console.time('transform');
    let transformedData = this.transformService.transform(mergedFormattedData, {}, outputFormat, allAttribsDataItemMap, this.isValueConcatRequired, this.appliedDisplayFilters); //this.isValueConcatRequired
    console.timeEnd('transform');
    let clientData = transformedData;
    this.applyDefaultSortingForCols(clientData, outputFormat, allAttribsDataItemMap, displayFilters);
    console.time('columnOptions');
    if (columnOptions) {
      clientData.isDefaultSortApplied = false;
      this.validateColumnFunctions(columnOptions, outputFormat, clientData, allAttribsDataItemMap);
      this.createDefaultSortInfo(outputFormat, allAttribsDataItemMap, clientData);
      this.modifySortInfo(columnOptions, clientData);
      this.applyColumnFunctions(columnOptions, clientData, outputFormat);
      clientData.validatedSortInfo = this.passedColumnOptions.sortInfo;
    }
    console.timeEnd('columnOptions');
    return clientData;
  };

  ReportDataService.prototype.applyDefaultSortingForCols = function (data, outputFormat, allAttribsDataItemMap, displayFilters) {
    if (data && _.size(data.cols) > 0) {
      let tempCols = [];
      let _this = this;
      for (let index = 0; index < data.cols.length; index++) {
        let column = data.cols[index];
        let currentColumn = outputFormat.columns[index];
        if (currentColumn === MeasureAttributesEnum.MeasureAttributeEnum.Name) {
          tempCols.push(column);
          continue;
        }
        var sortProps = _this.reportColumnService.getPropsToSort([currentColumn], allAttribsDataItemMap, _this.newAttribValObj, null, null);
        let orderedValuesLength = 0;
        if (displayFilters && displayFilters[currentColumn]) {
          orderedValuesLength = _.size(displayFilters[currentColumn].orderedValues);
        }
        let orderedColumns = _.dropRight(column, _.size(column) - orderedValuesLength);
        let unOrderedColumns = _.takeRight(column, _.size(column) - orderedValuesLength);
        column = _.concat(orderedColumns, _.orderBy(unOrderedColumns, sortProps.propsArray, sortProps.sortOrders));
        tempCols.push(column);
      }
      data.cols = tempCols;
    }
  };

  ReportDataService.prototype.validateColumnFunctions = function (columnOptions, outputFormat, clientData, allAttribsDataItemMap) {
    let cols = outputFormat.columns;
    let colIdItems = [];
    let _this = this;
    _.forEach(cols, function (currentCol) {
      colIdItems = _.concat(colIdItems, _.map(allAttribsDataItemMap[currentCol].idDataItems, function (idDataItem) {
        return idDataItem.name;
      }));
    });
    let allColIds = [];
    let colCount = clientData.cols && clientData.cols.reduce(function (runningProduct, currentArray) {
      return runningProduct * (currentArray.length || 1);
    }, 1);
    let allCols = colCount <= 10000 ? this.commonUtilsService.cartesianProdOfArrOfObjs(clientData.cols) : [];
    allColIds = _.keys(_this.transformService.createUniqueObjWithProps(allCols, colIdItems));
    _.forEach(_.intersectionWith(outputFormat.rows, outputFormat.groupedAttrs, _.isEqual), function (row) {
      let displayItems = allAttribsDataItemMap[row].displayDataItems;
      _.forEach(displayItems, function (displayItem) {
        allColIds.push(displayItem.name);
      });
    });
    if (_.size(cols) === 0) {
      allColIds.push('value');
    }
    if (columnOptions.sortInfo && !_.isEmpty(columnOptions.sortInfo)) {
      columnOptions.sortInfo = this.validateSortInfo(allColIds, columnOptions.sortInfo);
    }
    if (this.passedColumnOptions.sortInfo && !_.isEmpty(this.passedColumnOptions.sortInfo)) {
      this.passedColumnOptions.sortInfo = this.validateSortInfo(allColIds, this.passedColumnOptions.sortInfo);
    }

  }

  ReportDataService.prototype.validateSortInfo = function (allColIds, sortInfo) {
    if (sortInfo && !_.isEmpty(sortInfo) && _.size(sortInfo.sortedColumns) > 0) {
      let sortedColumns = [];
      _.forEach(sortInfo.sortedColumns, function (sortedColumn) {
        if (allColIds.indexOf(sortedColumn.colId) !== -1 || sortedColumn.isRowAttribute) {
          sortedColumns.push(sortedColumn);
        }
      });
      _.size(sortedColumns) ? sortInfo.sortedColumns = sortedColumns : sortInfo = {};
    }
    return sortInfo;
  };

  ReportDataService.prototype.validateTopXInfo = function (allColIds, topXInfo) {

  };

  ReportDataService.prototype.validateColumnFilterInfo = function (allColIds, columnFilterInfo) {

  };

  ReportDataService.prototype.createDefaultSortInfo = function (outputFormat, allAttribsDataItemMap, clientData) {
    this.nestedSortInfo = [];
    let _this = this;
    let currentRowsDisplayItems = [];
    let isTimeAttribOnRows = false;
    let timeAttribIndex = null;
    let timeAttribDisplayItem = null;
    _.each(outputFormat.rows, function (row, rowIndex) {
      let rowDataItemInfo = allAttribsDataItemMap[row];
      if (rowDataItemInfo) {
        if (rowDataItemInfo.displayDataItems[0].dataType.toLowerCase().indexOf('date') !== -1) {
          isTimeAttribOnRows = true;
          if (!timeAttribIndex) {
            timeAttribIndex = rowIndex
          }
          timeAttribDisplayItem = rowDataItemInfo.displayDataItems[0];
        }
        currentRowsDisplayItems.push(rowDataItemInfo.displayDataItems[0]);
      }
    });
    let colIds = [];
    let colNames = [];
    let cols = outputFormat.columns;
    let isTimeDefaultSort = isTimeAttribOnRows && timeAttribDisplayItem && _.size(outputFormat.rows) === 1;
    if (this.isNestedReport && isTimeAttribOnRows && timeAttribIndex === 0) {
      let nestedHierarchy = _.values(this.nestedHierarchies)[0];
      let nestedAttributes = _.cloneDeep(nestedHierarchy.hierarchies);
      if (_.size(this.groupInfo)) {
        _.forOwn(this.groupInfo, function (artifactId, groupId) {
          let crntGroupIndex = _.indexOf(nestedAttributes, groupId);
          if (crntGroupIndex !== -1) {
            nestedAttributes.splice(crntGroupIndex, 1, artifactId);
          }
        });
      }
      if (_.isEqual(outputFormat.rows, nestedAttributes)) {
        isTimeDefaultSort = true;
        _.each(outputFormat.rows, function (row, rowIndex) {
          if (rowIndex !== 0 && allAttribsDataItemMap[row]) {
            _this.nestedSortInfo.push({
              "colId": currentRowsDisplayItems[rowIndex].name,
              "colName": currentRowsDisplayItems[rowIndex].description,
              "isRowAttribute": true,
              "sortType": "asc"
            })
          }
        });
      }
    }
    if (isTimeDefaultSort) {
      colIds.push(timeAttribDisplayItem.name);
      colNames.push(timeAttribDisplayItem.description);
    } else if (_.size(cols) === 0) {
      colIds.push('value');
      colNames.push('Value');
    } else if (_.size(clientData.data) === 0) {
      this.defaultSortInfo = _.size(outputFormat.rows) ? {
        "sortedColumns": [{
          "colId": currentRowsDisplayItems[0].name,
          "colName": currentRowsDisplayItems[0].description,
          "isRowAttribute": true,
          "sortType": "asc"
        }]
      } : null;
      return;
    } else {
      _.each(clientData.cols, function (col, index) {
        let currentColAttribute = cols[index];
        let currentColIdItems = _.map(allAttribsDataItemMap[currentColAttribute].idDataItems, function (idDataItem) {
          return idDataItem.name;
        });
        let currentColDisplayItems = _.map(allAttribsDataItemMap[currentColAttribute].displayDataItems, function (displayDataItem) {
          return displayDataItem.name;
        });
        colIds = _.concat(colIds, _.values(_.pick(col[0], currentColIdItems)));
        colNames = _.concat(colNames, _.values(_.pick(col[0], currentColDisplayItems)));
      });
    }

    this.defaultSortInfo = {
      "sortedColumns": [{
        "colId": _.join(colIds, '_'),
        "colName": _.join(colNames, '_'),
        "isRowAttribute": isTimeDefaultSort,
        "sortType": isTimeDefaultSort ? "asc" : "desc"
      }]
    };
  };

  ReportDataService.prototype.modifySortInfo = function (columnOptions, clientData) {
    if (this.passedColumnOptions && _.isEmpty(this.passedColumnOptions.sortInfo) && this.defaultSortInfo) {
      columnOptions.sortInfo = _.cloneDeep(this.defaultSortInfo);
      columnOptions.sortInfo.sortedColumns = _.concat(columnOptions.sortInfo.sortedColumns, this.nestedSortInfo);
      clientData.isDefaultSortApplied = true;
      if (this.passedColumnOptions.sortInfo && _.size(this.passedColumnOptions.sortInfo.sortedColumns)) {
        this.passedColumnOptions.sortInfo.sortedColumns.push(columnOptions.sortInfo.sortedColumns[0]);
      } else {
        this.passedColumnOptions.sortInfo = columnOptions.sortInfo;
      }
    }
  };

  ReportDataService.prototype.applyColumnFunctions = function (columnOptions, clientData, outputFormat) {
    if (columnOptions) {
      // if (columnOptions.topXInfo && !_.isEmpty(columnOptions.topXInfo)) {
      //   clientData.data = this.reportColumnService.applyTopOrBottom(clientData.data, columnOptions.topXInfo, outputFormat.columns);
      // }
      if (columnOptions.sortInfo && !_.isEmpty(columnOptions.sortInfo)) {
        clientData.data = this.applySort(clientData.data, columnOptions.sortInfo, outputFormat);
        this.appliedSortInfoForUI = columnOptions.sortInfo;
      }
      if (columnOptions.columnFilterInfo && !_.isEmpty(columnOptions.columnFilterInfo)) {
        clientData.data = this.reportColumnService.getSearchResults(clientData.data, columnOptions.columnFilterInfo.columnFilters, search_filter_service.SearchLogicalCondition.And);
      }
      if (_.size(columnOptions.colorColumnFunctionInfo)) {
        this.colorColumnFunctionRangeSet = this.reportColumnService.getColorColumnRangeSet(clientData.data, columnOptions.colorColumnFunctionInfo, Defaults.partitionCount);
      } else {
        this.colorColumnFunctionRangeSet = null;
      }
    }
  };

  ReportDataService.prototype.getRangeSet = function (data, colIds, min, max) {
    return this.reportColumnService.getColorColumnRangeSet(data, colIds, Defaults.partitionCount, min, max);
  };

  ReportDataService.prototype.updateKpisInfo = function (updatedKpisDescriptionInfo, updatedKpiOrder, dataObject, additionalInfo, isNested) {
    var _this = this;
    if (_.size(updatedKpisDescriptionInfo)) {
      this.updateKpisDescription(updatedKpisDescriptionInfo);
    }
    if (_.size(updatedKpiOrder)) {
      this.updateKpisOrder(updatedKpiOrder);
    }
    return this.fetchData(dataObject, additionalInfo, false);
  };

  ReportDataService.prototype.updateKpisDescription = function (updatedKpisDescriptionInfo) {
    let _this = this;
    _.each(this.allLevelData, function (currentLevelData) {
      _.each(currentLevelData.data[MeasureAttributesEnum.MeasureAttributeEnum.Name], function (measure) {
        if (updatedKpisDescriptionInfo[measure[MeasureAttributesEnum.MeasureAttributeEnum.Name]]) {
          let newInfo = updatedKpisDescriptionInfo[measure[MeasureAttributesEnum.MeasureAttributeEnum.Name]];
          measure[MeasureAttributesEnum.MeasureAttributeEnum.Description] = newInfo.newDesc;
        }
      });
      if (currentLevelData.data.topInfoData && currentLevelData.data.topInfoData.topData && currentLevelData.data.topInfoData.topData[MeasureAttributesEnum.MeasureAttributeEnum.Name]) {
        currentLevelData.data.topInfoData.topData[MeasureAttributesEnum.MeasureAttributeEnum.Name] = currentLevelData.data[MeasureAttributesEnum.MeasureAttributeEnum.Name];
      }
    });
  };

  ReportDataService.prototype.updateKpisOrder = function (updatedKpiOrder) {
    let _this = this;
    _.each(this.allLevelData, function (currentLevelData) {
      let propsToUpdateKPIOrder = [MeasureAttributesEnum.MeasureAttributeEnum.Name, 'data'];
      let dataArrayToUpdate = [currentLevelData.data];
      if (currentLevelData.data.topInfoData && currentLevelData.data.topInfoData.topData && currentLevelData.data.topInfoData.topData[MeasureAttributesEnum.MeasureAttributeEnum.Name]) {
        dataArrayToUpdate.push(currentLevelData.data.topInfoData.topData);
      }
      _.each(dataArrayToUpdate, function (data) {
        _.each(propsToUpdateKPIOrder, function (prop) {
          let measureUnqiueValuesGroupBy = _.groupBy(data[prop], MeasureAttributesEnum.MeasureAttributeEnum.Name);
          let modifiedKpiOrder = _.unionWith(updatedKpiOrder, _.keys(measureUnqiueValuesGroupBy), _.isEqual);
          let tempData = [];
          _.each(modifiedKpiOrder, function (msr) {
            if (measureUnqiueValuesGroupBy && measureUnqiueValuesGroupBy[msr]) {
              tempData = tempData.concat(measureUnqiueValuesGroupBy[msr]);
            }
          });
          data[prop] = tempData;
        });
      });
    });
  };

  ReportDataService.prototype.updateTotalDescription = function (updatedTotalDescriptionInfo, dataObject, additionalInfo, isNested) {
    var _this = this;
    _.each(this.allLevelData, function (currentLevelData) {
      _.forOwn(updatedTotalDescriptionInfo, function (totalDescription, totalKey) {
        if (currentLevelData.data && currentLevelData.data[totalKey]) {
          _.each(currentLevelData.data[totalKey], function (currentTotalUniqueValue) {
            currentTotalUniqueValue[totalKey + Defaults.defaultNameProperty] = totalDescription;
          });
        }
      })
    });
    return isNested ? null : this.fetchData(dataObject, additionalInfo, false);
  };

  ReportDataService.prototype.mergeServiceData = function (resultData, uniqObj, allAttribsDataItemMap, nestedHierarchies, groupInfo) {
    return this.dataMergeService.merge(resultData, this.reportMetaData, uniqObj, allAttribsDataItemMap, nestedHierarchies, groupInfo);
  };

  ReportDataService.prototype.getTargetAttributeValue = function (sourceAttribVal, targetAttrib) {
    var currentLevelData = this.allLevelData[this.currentLevelIndex];
    if (currentLevelData) {
      var metaData = currentLevelData.metaData;
      var data = currentLevelData.data;
      var sourceAttribValRecord = _.find(data && data.data, function (record) {
        return _.isEqual(_.pick(record, _.keys(sourceAttribVal)), sourceAttribVal);
      });
      if (sourceAttribValRecord) {
        var targetAttribDataItems = metaData.allAttribsDataItemMap[targetAttrib];
        if (targetAttribDataItems && targetAttribDataItems.idDataItems) {
          var targetIdDataItemNames = _.map(targetAttribDataItems.idDataItems, function (idDataItem) {
            return idDataItem.name;
          });
          var targetVal = _.pick(sourceAttribValRecord, targetIdDataItemNames);
          if (_.isEmpty(targetVal) || !data[targetAttrib]) {
            return null
          } else {
            return _.find(data[targetAttrib], function (targetAttribUniqueVal) {
              return _.isEqual(_.pick(targetAttribUniqueVal, targetIdDataItemNames), targetVal);
            });
          }
        }
      } else {
        return null;
      }
    }
  };

  ReportDataService.prototype.formatMergedDataValues = function (mergedData, attribMap) {
    return this.formatService.format(mergedData, attribMap, this.newAttribValObj);
  };

  ReportDataService.prototype.mergeServerData = function (dataToMerge, outputFormat, reportMetaData) {
    var result = {
      data: [],
      MEASURE: []
    };
    result.data = this.dataMergeService.mergeServerData(dataToMerge.resultData._data, dataToMerge.resultData.attribColumns, dataToMerge.resultData.measureColumns, dataToMerge.resultData.columnMap);
    this.dataMergeService.convertAndMergeUniqueValues(dataToMerge, result);
    this.dataMergeService.mergeMeasuresIntoUniqueValues(result, reportMetaData);
    return result;
  };

  ReportDataService.prototype.getSortedDataForDisplayFilters = function (data, sortInfo, outputFormat) {
    if (sortInfo.sortedColumns.length == 0) {
      return data;
    }
    let _this = this;
    let currentLevel = this.getCurrentLevelData();
    let allAttribsDataItemMap = currentLevel.metaData.allAttribsDataItemMap;
    let displayFilterAttributeProps = [];
    let displayFiltersPassed = [];
    let updatedInfo = this.displayFilterService.getUpdatedDisplayFilterAttributesAndSortInfo(this.displayFiltersPassed, sortInfo, outputFormat, allAttribsDataItemMap);
    if (!(updatedInfo && _.size(updatedInfo.sortInfo.sortedColumns) > 0)) {
      return data;
    }
    for (let i = 0; i < updatedInfo.displayFilterAttributes.length; i++) {
      displayFilterAttributeProps.push(_.map(allAttribsDataItemMap[updatedInfo.displayFilterAttributes[i]] && allAttribsDataItemMap[updatedInfo.displayFilterAttributes[i]]['idDataItems'], 'name'));
      displayFiltersPassed.push(this.displayFiltersPassed[updatedInfo.displayFilterAttributes[i]].orderedValues);
    }

    let rowAttributeCols = {};
    let columns = [];
    let sortOrders = [];
    let propsPathArray = [];

    _.forEach(sortInfo.sortedColumns, function (sortedColumn) {
      let attribute = sortedColumn.isRowAttribute ? _this.displayFilterService.getAttributeBasedOnNamedItem(sortedColumn.colId, allAttribsDataItemMap) : sortedColumn.colId;
      columns.push(attribute);
      if (sortedColumn.isRowAttribute) {
        rowAttributeCols[attribute] = null;
      }
      sortOrders.push(sortedColumn.sortType);
    });
    return this.reportColumnService.getSortedData(data, displayFilterAttributeProps, columns, sortOrders, rowAttributeCols, allAttribsDataItemMap, this.newAttribValObj, propsPathArray, displayFiltersPassed);
  };

  ReportDataService.prototype.applySort = function (data, sortInfo, outputFormat) {
    this.sortedData = [];
    let sortedData = this.getSortedDataForDisplayFilters(data, sortInfo, outputFormat);
    return sortedData;
  };

  ReportDataService.prototype.isCriteriaMatch = function (criteria, reportMetaData) {
    let source = this.commonUtilsService.deepSort({
      "format": criteria.metaData.outputFormat.groupedAttrs,
      "hierarchies": criteria.metaData.reportInfo.reportInfo.hierarchies
    });
    let dest = this.commonUtilsService.deepSort({
      "format": reportMetaData.outputFormat.groupedAttrs,
      "hierarchies": reportMetaData.reportInfo.reportInfo.hierarchies
    });
    let propsToOmit = ['totalAttribName'];
    let objectsToCompare = [source, dest];
    _.forEach(objectsToCompare, function (object) {
      _.forEach(object.hierarchies, function (hierarchy) {
        _.forEach(propsToOmit, function (propToOmit) {
          delete hierarchy[propToOmit];
        });
      });
    });
    return _.isEqual(source, dest);
  };

  ReportDataService.prototype.fetchDataFromApi = function (criteria) {
    return criteria;
  };

  ReportDataService.prototype.getAdditionalData = function (additionalInfo, finalData, dataToTransform, outputFormat, allAttribsDataItemMap, columnOptions) {
    this.additionalDataService.getAdditionalData(additionalInfo, finalData, dataToTransform, outputFormat, allAttribsDataItemMap, columnOptions, this);
  };

  ReportDataService.prototype.getColorColumnFunctionColor = function (colId, value, startColor, endColor, colorColumnRangeSet) {
    let rangeSet = colorColumnRangeSet ? colorColumnRangeSet[colId] : this.colorColumnFunctionRangeSet[colId];
    let partitionCount = Defaults.partitionCount;
    let color;
    if (rangeSet) {
      color = this.reportColumnService.getColorColumnFunctionColor(value, rangeSet, startColor, endColor, partitionCount);
    }
    return color;
  };

  ReportDataService.prototype.getGradientColor = function (startColor, endColor, partitionCount, slotNumber) {
    return this.commonUtilsService.getGradientColor(startColor, endColor, partitionCount, slotNumber);
  }

  ReportDataService.prototype.getConcatedValues = function (attributes, displayFilters, outputFormat) {
    let groupedAttrs = outputFormat.groupedAttrs;
    let tempFormat = {};
    tempFormat['rows'] = {};
    _.each(attributes, function (attr) {
      tempFormat['rows'][attr] = attr;
    });
    tempFormat['columns'] = {};
    tempFormat['pages'] = {};
    tempFormat['groupedAttrs'] = groupedAttrs;
    let currentLevel = _.cloneDeep(this.getCurrentLevelData());
    this.createDisplayFilters(currentLevel.data, displayFilters, currentLevel.metaData.allAttribsDataItemMap);
    if (this.appliedDisplayFilters && Object.keys(this.appliedDisplayFilters).length) {
      currentLevel.data.data = this.applyDisplayFilters(this.appliedDisplayFilters, outputFormat, currentLevel.data.data);
    }
    let transformedData = this.transformService.transform(currentLevel.data, {}, tempFormat, currentLevel.metaData.allAttribsDataItemMap, true, {});
    return _.map(transformedData.data, function (x) {
      delete x['value'];
      return x;
    });
  };

  ReportDataService.setPresetColors = function (colors) {
    if (_.size(colors)) {
      Defaults.colors = colors;
    }
  };

  ReportDataService.prototype.deleteCurrentRequestedData = function (sourceReportInfo) {
    var data = this.searchInMemory(sourceReportInfo);
    if (data) {
      var indexOfCurrentData = _.findIndex(this.allLevelData, function (levelData) {
        return _.isEqual(levelData.data, data);
      });
      if (indexOfCurrentData !== -1) {
        this.allLevelData.splice(indexOfCurrentData, 1);
      }
    }
  };

  // this modifies the report info and output format with respect to the nested expanded level passed.
  ReportDataService.prototype.modifyDataObject = function (dataObject) {
    var resultData = dataObject.resultData;
    if (_.size(dataObject.nestedFilters)) {
      dataObject.resultData = null;
      dataObject = _.cloneDeep(dataObject);
      var expandedLevel = dataObject.nestedExpandedLevel;
      var nestedHier = _.find(dataObject.reportInfo.reportInfo.hierarchies, function (hier) {
        return hier.hierarchyType === 2;
      });
      nestedHier.hierarchyState.expandedLevels = expandedLevel;
      var attrsToRemove = _.slice(nestedHier.hierarchies, expandedLevel);
      if (_.size(dataObject.groupInfo)) {
        _.forOwn(dataObject.groupInfo, function (artifactId, groupId) {
          let crntGroupIndex = _.indexOf(attrsToRemove, groupId);
          if (crntGroupIndex !== -1) {
            attrsToRemove.splice(crntGroupIndex, 1, artifactId);
          }
        });
      }
      dataObject.outputFormat.groupedAttrs = _.difference(dataObject.outputFormat.groupedAttrs, attrsToRemove);
      dataObject.resultData = resultData;
      dataObject.allAttribsDataItemMap = _.omit(dataObject.allAttribsDataItemMap, attrsToRemove);
    }
    return dataObject;
  };

  return ReportDataService;
}());
exports.ReportDataService = ReportDataService;
exports.ChartPropertiesService = ChartPropertiesService;
exports.ChartElementsService = ChartElementsService;