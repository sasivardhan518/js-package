"use strict";
var _ = require('lodash');
var report_data_transform_service_1 = require("./report-data-transform-service");
var report_data_filter_service = require("./report-data-filter-service");
var nested_grid_service = require("./nested-grid-service");
var report_column_service = require("./report-column-service");
var common_utils_service = require("./common-utils-service");
var Defaults = require("./defaults").defaults;
var ReportAdditionalDataService = (function () {


  function ReportAdditionalDataService() {
    this.transformService = new report_data_transform_service_1.ReportTranformDataService();
    this.reportDataFilterService = new report_data_filter_service.ReportDataFilterService();
    this.nestedGridService = new nested_grid_service.NestedGridService();
    this.reportColumnService = new report_column_service.ColumnService();
    this.commonUtilsService = new common_utils_service.CommonUtilsService();
    this.nestedLevelsData = {};
  }
  ReportAdditionalDataService.prototype.getChartSpecificData = function (finaldata, filteredData, outputFormat, allAttribsDataItemMap) {
    var input = {
      displayFilters: finaldata.appliedDisplayFilters,
      dataToTransform: finaldata,
      data: filteredData,
      outputFormat: outputFormat,
      allAttribsDataItemMap: allAttribsDataItemMap
    }
    var chartObject = {
      colDescription: this.getChartRowColumnProperties(input, false, true),
      colName: this.getChartRowColumnProperties(input, false, false),
      colVals: this.getRowOrColumnVals(input, false),
      isGridLayoyt: false,
      rowDescription: this.getChartRowColumnProperties(input, true, true),
      rowName: this.getChartRowColumnProperties(input, true, false),
      rowVals: this.getRowOrColumnVals(input, true)
    }
    return chartObject;
  };

  ReportAdditionalDataService.prototype.getChartRowColumnProperties = function (input, isRow, isDescription) {
    var rowsOrCols = isRow ? _.intersection(input.outputFormat.rows, input.outputFormat.groupedAttrs) : _.intersection(input.outputFormat.columns, input.outputFormat.groupedAttrs);
    var nameOrDescriptions = [];
    _.each(rowsOrCols, function (rowOrCol) {
      var dataItemMap = input.allAttribsDataItemMap[rowOrCol];
      _.each(isDescription ? dataItemMap.displayDataItems : dataItemMap.idDataItems, function (displayItem) {
        nameOrDescriptions.push(displayItem.name);
      })
    });
    return _.join(nameOrDescriptions, '_');
  }

  ReportAdditionalDataService.prototype.getRowOrColumnVals = function (input, isRow) {
    let tempFormat = _.cloneDeep(input.outputFormat);
    let rows = tempFormat.rows;
    let cols = tempFormat.columns;
    tempFormat.rows = isRow ? rows : cols;
    tempFormat.columns = [];
    if (tempFormat.rows.length == 0) {
      return [];
    }
    var filteredData = input.data;
    var transformedData = this.transformService.transform(filteredData, {}, tempFormat, input.allAttribsDataItemMap, true, {});
    return _.map(transformedData.data, function (x) {
      delete x['value'];
      return x;
    });
  };

  ReportAdditionalDataService.prototype.getGridData = function (finaldata, filteredData, outputFormat, allAttribsDataItemMap) {
    let _this = this;
    let gridData = [];
    let gridRows = outputFormat.gridRows;
    let gridColumns = outputFormat.gridColumns;
    let tempFormat = _.cloneDeep(outputFormat);
    tempFormat.rows = gridRows;
    tempFormat.columns = gridColumns;
    if (!(gridRows.length + gridColumns.length)) {
      return gridData;
    }
    let gridColIdItems = [];
    let gridColDisplayItems = [];
    let gridRowIdItems = [];
    let gridRowDisplayItems = [];
    _this.getDataItems(gridRows, allAttribsDataItemMap, Defaults.dataItemsEnum.idDataItems, gridRowIdItems);
    _this.getDataItems(gridRows, allAttribsDataItemMap, Defaults.dataItemsEnum.displayDataItems, gridRowDisplayItems);
    _this.getDataItems(gridColumns, allAttribsDataItemMap, Defaults.dataItemsEnum.idDataItems, gridColIdItems);
    _this.getDataItems(gridColumns, allAttribsDataItemMap, Defaults.dataItemsEnum.displayDataItems, gridColDisplayItems);
    var gridRowColIdItems = _.concat(gridRowIdItems, gridColIdItems);
    var finalDataCopy = _.cloneDeep(finaldata);
    if (_.size(finaldata.appliedDisplayFilters)) {
      _.forOwn(finaldata.appliedDisplayFilters, function (value, key) {
        finalDataCopy[key] = _.intersectionWith(finalDataCopy[key], value, _.isEqual);
      })
    }
    var gridRowColValues = this.getChartSpecificData(finalDataCopy, filteredData, tempFormat, allAttribsDataItemMap);
    if (_.size(gridRows) == 0) {
      gridRowColValues.rowVals.push({});
    }
    if (_.size(gridColumns) == 0) {
      gridRowColValues.colVals.push({});
    }
    var tempData = _.cloneDeep(filteredData.data);
    console.time("gridData");
    for (var i = 0, rowLength = gridRowColValues.rowVals.length; i < rowLength; i++) {
      let gridRowVal = gridRowColValues.rowVals[i];
      let cols = [];
      let dataForMinMax = [];
      if (tempData.length == 0) {
        break;
      }
      for (var j = 0, colLength = gridRowColValues.colVals.length; j < colLength; j++) {
        let gridColVal = gridRowColValues.colVals[j];
        let gridRowColVal = _.cloneDeep(_.assign({}, _.pick(gridRowVal, gridRowColIdItems), _.pick(gridColVal, gridRowColIdItems)));
        let gridRowColData = [];
        for (let i = 0, length = tempData.length; i < length; i++) {
          if (_.isEqual(_.pick(tempData[i], gridRowColIdItems), gridRowColVal)) {
            gridRowColData.push(tempData[i]);
            tempData.splice(i, 1);
            i--;
            length--;
          }
        }
        dataForMinMax = (_.concat(dataForMinMax, _.map(gridRowColData, 'value'))).map(Number);
        cols.push({
          min: _.min((_.map(gridRowColData, 'value')).map(Number)),
          max: _.max((_.map(gridRowColData, 'value')).map(Number)),
          colName: _this.transformService.getConcatenatedValues(gridColVal, gridColIdItems),
          colDescription: _this.transformService.getConcatenatedValues(gridColVal, gridColDisplayItems),
          data: gridRowColData,
          colVal: gridColVal
        });
      }
      gridData.push({
        rowName: _this.transformService.getConcatenatedValues(gridRowVal, gridRowIdItems),
        rowDescription: _this.transformService.getConcatenatedValues(gridRowVal, gridRowDisplayItems),
        cols: cols,
        rowVal: gridRowVal,
        min: _.min(dataForMinMax),
        max: _.max(dataForMinMax)
      })
    }
    console.timeEnd("gridData");
    console.log(gridData);
    return this.removeInvalidData(gridData);
  }

  ReportAdditionalDataService.prototype.prepareQuartileData = function (dataObj, colValues, isCustomScalingRequired, isGridLayout) {
    let values = [];
    if (_.size(colValues)) {
      _.each(dataObj, function (record) {
        let recordValues = _.values(_.pick(record, colValues));
        values = values.concat(recordValues);
      });
    } else {
      values = _.map(dataObj, 'value');
    }
    let dataMin = _.min(values);
    let dataMax = _.max(values);
    if (!isCustomScalingRequired) {
      return {
        min: dataMin,
        max: dataMax
      };
    } else if (_.size(dataObj) <= 9) {
      return {
        min: isGridLayout ? dataMin : undefined,
        max: isGridLayout ? dataMax : undefined
      }
    }
    values = _.sortBy(values);
    let median, quartile1, quartile3, interQuartileRange, upperControlLimit, lowerControlLimit;
    if (_.size(values) % 2 === 0) {
      let medianIndex = Math.floor(_.size(values) / 2);
      median = (values[medianIndex] + values[medianIndex - 1]) / 2;
      let lowerHalf = Math.floor(medianIndex / 2);
      quartile1 = values[lowerHalf];
      quartile3 = values[medianIndex + lowerHalf];
      interQuartileRange = quartile3 - quartile1;
      upperControlLimit = quartile3 + 2 * interQuartileRange;
      lowerControlLimit = quartile1 - 2 * interQuartileRange;
    } else {
      let halfSize = Math.floor((_.size(values) + 1) / 2);
      median = values[halfSize - 1];
      if (((_.size(values) - 1) / 4) % 2 === 0) {
        let n = (_.size(values) - 1) / 4;
        quartile1 = (values[n - 1] * 0.75) + (values[n] * 0.25);
        quartile3 = (values[3 * n] * 0.75) + (values[3 * n + 1] * 0.25);
      } else {
        let n = (_.size(values) - 3) / 4;
        quartile1 = (values[n] * 0.75) + (values[n + 1] * 0.25);
        quartile3 = (values[3 * n + 1] * 0.25) + (values[3 * n + 2] * 0.75);
      }
      let lowerHalf = Math.floor(halfSize / 2);
      quartile1 = values[lowerHalf - 1];
      quartile3 = values[halfSize + lowerHalf - 1];
      interQuartileRange = quartile3 - quartile1;
      upperControlLimit = quartile3 + 2 * interQuartileRange;
      lowerControlLimit = quartile1 - 2 * interQuartileRange;
    }
    let isQuartileMinMaxRequired = ((dataMax - dataMin) / interQuartileRange) > 10;
    let result = _.filter(values, function (value) {
      return (value <= upperControlLimit && value >= lowerControlLimit);
    });
    return {
      min: isQuartileMinMaxRequired ? _.min(result) : dataMin,
      max: isQuartileMinMaxRequired ? _.max(result) : dataMax
    }
  }
  ReportAdditionalDataService.prototype.removeInvalidData = function (data) {
    var finalValidData = [];
    var listOfColIndexes = [];
    _.each(data, function (row, rowIndex) {
      var colsWithData = _.filter(row.cols, function (col, colIndex) {
        if (rowIndex == 0) {
          if (col.data.length == 0) {
            listOfColIndexes.push(colIndex);
          }
        } else {
          if (col.data.length > 0 && listOfColIndexes.indexOf(colIndex) != -1) {
            listOfColIndexes.splice(listOfColIndexes.indexOf(colIndex), 1);
          }
        }
        return col.data.length > 0
      });
      if (colsWithData.length > 0) {
        finalValidData.push(row);
      }
    });
    _.each(finalValidData, function (row) {
      row.cols = _.filter(row.cols, function (col, index) {
        return listOfColIndexes.indexOf(index) == -1;
      })
    });
    return finalValidData;
  };

  ReportAdditionalDataService.prototype.getAdditionalData = function (additionalInfo, finalData, dataToTranform, outputFormat, allAttribsDataItemMap, columnOptions, reportDataService) {
    if (additionalInfo) {
      let uniqueRowValObject;
      let uniqueRowValues;
      let _this = this;
      let filteredData = dataToTranform.data;
      let requestObject = _this.commonUtilsService.deepCloneObjects(reportDataService.inputObject);
      let displayFilters = requestObject.filters.displayFilters;
      let displayFilterAttributeProps = [];
      let displayOrderedGridRows = [];
      let displayFiltersPassed = [];
      let otherAttribsInNestedHier = [];
      if (additionalInfo.isNested) {
        var reportInfo = requestObject.reportInfo.reportInfo;
        var nestedHier = _.find(reportInfo.hierarchies, function (hier) {
          return hier.hierarchyType === 2;
        });
        otherAttribsInNestedHier = [];
        //nestedHier.hierarchies.slice(1, _.size(nestedHier.hierarchies));
      }
      _.each(_.intersection(outputFormat.rows, outputFormat.groupedAttrs), function (row) {
        if (displayFilters[row] && _.size(displayFilters[row].orderedValues) > 0 && !_.includes(otherAttribsInNestedHier, row)) {
          displayOrderedGridRows.push(row);
          displayFilterAttributeProps.push(_.map(allAttribsDataItemMap[row].idDataItems, function (idDataItem) {
            return idDataItem.name
          }));
          displayFiltersPassed.push(displayFilters[row].orderedValues);
        }
      });
      let newAttribValsObj = reportDataService.newAttribValsObj;

      if (additionalInfo.isValueConcatenationRequired) {
        reportDataService.isValueConcatRequired = true;
      }

      if (!_.isEmpty(additionalInfo.nestedFilters)) {
        additionalInfo.nestedFilters = _this.modifyNestedFilterForGridLayout(additionalInfo.nestedFilters, finalData, outputFormat, allAttribsDataItemMap, reportDataService, nestedHier);
      }
      if (additionalInfo.isNested && !_.isEmpty(additionalInfo.nestedFilters)) {
        let tempData = [];
        _this.getNestedLevelsData(requestObject, additionalInfo.nestedFilters, reportDataService, finalData);
        if (!_this.isDataAvailable) {
          return;
        }
        _.forOwn(additionalInfo.nestedFilters, function (levels, nestedHierarchyName) {
          if (_.keys(levels).indexOf('0') === -1) {
            return;
          }
          _.forOwn(levels, function (filterValues, levelIndex) {
            tempData = parseInt(levelIndex) === 0 ? _this.nestedLevelsData[nestedHierarchyName][0] : tempData;
            // tempData = _this.reportColumnService.getSortedData(tempData, displayFilterAttributeProps, additionalInfo.gridLayoutSortRowAttribIds, null, null, allAttribsDataItemMap, newAttribValsObj, [], displayFiltersPassed);
            let currentLevelData = _this.nestedLevelsData[nestedHierarchyName][parseInt(levelIndex) + 1];
            _.forOwn(filterValues, function (filterValueObj, filterKey) {
              let filteredData = _this.reportDataFilterService.getFilteredData(currentLevelData, filterValueObj);
              // filteredData = _this.reportColumnService.getSortedData(filteredData, displayFilterAttributeProps, additionalInfo.gridLayoutSortRowAttribIds, null, null, allAttribsDataItemMap, newAttribValsObj, [], displayFiltersPassed);
              let previousLevelRecord = _this.reportDataFilterService.getFilteredData(tempData, filterValueObj)[0];
              if (previousLevelRecord && !_.isEmpty(previousLevelRecord)) {
                let indexToInsert = _.indexOf(tempData, previousLevelRecord);
                tempData.splice(indexToInsert + 1, 0, filteredData);
                tempData = _.flattenDeep(tempData);
              }
            });
          });
        });

        this.addNameAndDescToData(tempData, reportDataService.inputObject, outputFormat);
        if (additionalInfo.isDataRequired) {
          finalData.data = tempData;
        }
        if (additionalInfo.isGridDataRequired) {
          dataToTranform.data = tempData;
        }
        filteredData = tempData;
        finalData.additionalData = {};
        let colIdItems = [];
        let colDisplayItems = [];
        _this.getDataItems(outputFormat.columns, allAttribsDataItemMap, Defaults.dataItemsEnum.idDataItems, colIdItems);
        _this.getDataItems(outputFormat.columns, allAttribsDataItemMap, Defaults.dataItemsEnum.displayDataItems, colDisplayItems);
        finalData.additionalData.colName = _.join(colIdItems, '_');
        finalData.additionalData.colDescription = _.join(colDisplayItems, '_');
        finalData.additionalData.rowName = 'name';
        finalData.additionalData.rowDescription = 'description';
        uniqueRowValues = ['name'];
        uniqueRowValObject = this.transformService.createUniqueObj(filteredData, uniqueRowValues, '_');
        finalData.additionalData.rowVals = _.values(uniqueRowValObject);
        finalData.additionalData.colVals = _.size(this.nestedLevelsData.cols) ? this.commonUtilsService.cartesianProdOfArrOfObjs(this.nestedLevelsData.cols) : [];
        finalData.cols = _.size(this.nestedLevelsData.cols) ? this.nestedLevelsData.cols : [];
        this.addNameAndDescToData(finalData.additionalData.colVals, requestObject, false);
      }
      if (additionalInfo.isRowColumnDataRequired && !(additionalInfo.isNested && !_.isEmpty(additionalInfo.nestedFilters))) {
        finalData.additionalData = this.getChartSpecificData(finalData, dataToTranform, outputFormat, allAttribsDataItemMap);
        uniqueRowValues = [];
        let attrs = _.intersection(outputFormat.rows, outputFormat.groupedAttrs);
        _.each(attrs, function (attr) {
          if (allAttribsDataItemMap[attr]) {
            let idItems = _.map(allAttribsDataItemMap[attr].idDataItems, function (idDataItem) {
              return idDataItem.name
            });
            uniqueRowValues = _.concat(uniqueRowValues, idItems);
          }
        });
        uniqueRowValObject = this.transformService.createUniqueObj(finalData.additionalData.rowVals, uniqueRowValues, '_');
      }
      if (additionalInfo.scalesInfo && !_.isEmpty(additionalInfo.scalesInfo)) {
        _.forOwn(additionalInfo.scalesInfo, function (values, key) {
          let colValues;
          if (additionalInfo.isNested && !_.isEmpty(additionalInfo.nestedFilters)) {
            let vals = _.size(values.axisValues) > 0 ? _this.commonUtilsService.getIntersectedValues(finalData.additionalData.colVals, values.axisValues, _.keys(values.axisValues[0])) : [];
            colValues = _.map(vals, function (colVal) {
              return colVal[finalData.additionalData.colName];
            });
          }
          let isValueColumn = _.size(values.axisValues) === 1 && _.isEqual(values.axisValues[0], {
            'value': 'value'
          });
          let filteredDataForCurrentScale = _.size(values.axisValues) && _.size(colValues) === 0 && !isValueColumn ? _this.reportDataFilterService.filterData(filteredData, values.axisValues) : filteredData;
          let minMaxValues = _this.prepareQuartileData(filteredDataForCurrentScale, colValues, values.isCustomScalingRequired, additionalInfo.isGridLayout);
          values.min = minMaxValues.min;
          values.max = minMaxValues.max;
        });
        finalData.scalesInfo = additionalInfo.scalesInfo;
      }
      if (additionalInfo.isGridDataRequired) {
        let columnProps = [];
        let rowPropsToPick = [];
        let rows = additionalInfo.gridLayoutSortRowAttribIds || [];
        displayFiltersPassed = [];
        _.each(rows, function (row) {
          if (displayFilters[row] && _.size(displayFilters[row].orderedValues) > 0) {
            displayFiltersPassed.push(displayFilters[row].orderedValues);
          } else {
            displayFiltersPassed.push([]);
          }
          if (allAttribsDataItemMap[row]) {
            let idItems = _.map(allAttribsDataItemMap[row].idDataItems, function (idDataItem) {
              return idDataItem.name
            });
            let displayItems = _.map(allAttribsDataItemMap[row].displayDataItems, function (displayDataItem) {
              return displayDataItem.name
            })
            columnProps.push(idItems);
            rowPropsToPick = _.concat(rowPropsToPick, idItems, displayItems);
          } else {
            columnProps.push([row]);
            rowPropsToPick = _.concat(rowPropsToPick, [row]);
          }
        });
        finalData.gridData = this.getGridData(finalData, dataToTranform, outputFormat, allAttribsDataItemMap);
        let _this = this;
        let gridDataToTransform = _.cloneDeep(dataToTranform);
        let colsToRemove = _.size(outputFormat.columns) ? _.map(finalData.additionalData.colVals, function (colVal) {
          return colVal[finalData.additionalData.colName];
        }) : 'value';
        _.each(finalData.gridData, function (gridDataRow) {
          _.each(gridDataRow.cols, function (gridDataCol) {
            if (gridDataCol.data.length > 0) {
              let tempData = {};
              if (!(additionalInfo.isNested && !_.isEmpty(additionalInfo.nestedFilters))) {
                gridDataToTransform.data = gridDataCol.data;
                let tempOutputFormat = _.cloneDeep(outputFormat);
                tempOutputFormat.rows = _.concat(outputFormat.rows, outputFormat.gridRows, outputFormat.gridColumns);
                tempData = reportDataService.transformColFuncPrepareClientData(gridDataToTransform, tempOutputFormat, allAttribsDataItemMap);
                gridDataCol.data = tempData && tempData.data ? tempData.data : [];
              } else {
                tempData.data = gridDataCol.data;
                tempData.cols = _this.nestedLevelsData.cols;
              }
              let uniqueKeys = Object.keys(uniqueRowValObject);
              if (uniqueKeys.length != gridDataCol.data.length && !additionalInfo.isMap) {
                let gridDataUniqueObject = _this.transformService.createUniqueObj(gridDataCol.data, uniqueRowValues, '_');
                for (let i = 0; i < uniqueKeys.length; i++) {
                  let key = uniqueKeys[i];
                  if (!gridDataUniqueObject.hasOwnProperty(key)) {
                    gridDataCol.data.splice(i, 0, _.omit(uniqueRowValObject[key], colsToRemove));
                  }
                }
              }
              gridDataCol.data = _this.reportColumnService.getSortedDataInOrder(gridDataCol.data, columnProps, rows, null, null, allAttribsDataItemMap, newAttribValsObj, [], displayFiltersPassed);
              gridDataCol.cols = tempData && tempData.cols;
            }
          });
        });
        finalData.additionalData.rowVals = _this.reportColumnService.getSortedDataInOrder(finalData.additionalData.rowVals, columnProps, rows, null, null, allAttribsDataItemMap, newAttribValsObj, [], displayFiltersPassed);
      }
    }
  };

  ReportAdditionalDataService.prototype.modifyNestedFilterForGridLayout = function (nestedFilters, finalData, outputFormat, allAttribsDataItemMap, reportDataService, nestedHier) {
    let _this = this;
    let groupInfo = reportDataService.groupInfo;
    let modifiedNestedFilters = {};
    let rowAttribs = _.cloneDeep(outputFormat.rows);
    _.forOwn(nestedFilters, function (levels, hierarchyName) {
      modifiedNestedFilters[hierarchyName] = {};
      _.forOwn(levels, function (filters, level) {
        var expandedLevelForCurrentLevel = parseInt(level) + 2;
        var isDataAvailable = _.find(reportDataService.allLevelData, function (currentLevelData) {
          if (_.has(currentLevelData, ['metaData', 'reportInfo', 'reportInfo', 'hierarchies'])) {
            var nestedHier = _.find(currentLevelData.metaData.reportInfo.reportInfo.hierarchies, function (hier) {
              return hier.key === hierarchyName;
            });
            return nestedHier.hierarchyState.expandedLevels === expandedLevelForCurrentLevel;
          }
        });
        if (!isDataAvailable) {
          return;
        }
        let rowAttrsToRemove = _.takeRight(nestedHier.hierarchies, (_.size(nestedHier.hierarchies) - (parseInt(level) + 1)));
        if (_.size(groupInfo)) {
          _.forOwn(groupInfo, function (artifactId, groupId) {
            let crntGroupIndex = _.indexOf(rowAttrsToRemove, groupId);
            if (crntGroupIndex !== -1) {
              rowAttrsToRemove.splice(crntGroupIndex, 1, artifactId);
            }
          });
        }
        let props = [];
        _.each(_.difference(rowAttribs, rowAttrsToRemove), function (attr, index) {
          if (allAttribsDataItemMap[attr]) {
            let idItems = _.map(allAttribsDataItemMap[attr].idDataItems, function (x) {
              return x.name;
            });
            props = _.concat(props, idItems);
          }
        });
        modifiedNestedFilters[hierarchyName][level] = {};
        let validNestedFiltersForCurrentLevel = {};
        _.forOwn(filters, function (nestedFilter, filterKey) {
          if (_.isEqual(_.orderBy(_.keys(nestedFilter)), _.orderBy(props))) {
            validNestedFiltersForCurrentLevel[filterKey] = nestedFilter;
          }
        });
        if (_.size(validNestedFiltersForCurrentLevel)) {
          modifiedNestedFilters[hierarchyName][level] = validNestedFiltersForCurrentLevel;
        } else {
          delete modifiedNestedFilters[hierarchyName][level];
        }
      });
      if (_.isEmpty(modifiedNestedFilters[hierarchyName])) {
        delete modifiedNestedFilters[hierarchyName];
      }
    });
    return modifiedNestedFilters;
  };

  ReportAdditionalDataService.prototype.getNestedLevelsData = function (requestObject, nestedFilters, reportDataService, finalData) {
    requestObject = _.cloneDeep(requestObject);
    this.nestedLevelsData = {};
    let _this = this;
    _this.isDataAvailable = true;
    if (_.size(requestObject.outputFormat.gridRows) > 0 || _.size(requestObject.outputFormat.gridColumns) > 0) {
      requestObject.outputFormat.rows = _.concat(requestObject.outputFormat.rows, requestObject.outputFormat.gridRows, requestObject.outputFormat.gridColumns);
    }
    _.forOwn(nestedFilters, function (levels, nestedHierarchyName) {
      if (_.keys(levels).indexOf('0') === -1) {
        return;
      }
      if (!_this.nestedLevelsData.hasOwnProperty(nestedHierarchyName)) {
        _this.nestedLevelsData[nestedHierarchyName] = [];
      }
      _.forOwn(levels, function (filterValues, levelIndex) {
        if (parseInt(levelIndex) === 0) {
          let topLevelRequestObject = _this.nestedGridService.changeRowHierarchyLevel(requestObject, nestedHierarchyName, 1);
          topLevelRequestObject.nestedFilters = null;
          if (topLevelRequestObject.columnOptions && !_.isEmpty(topLevelRequestObject.columnOptions.topXInfo) && (requestObject.outputFormat.gridRows.length > 0 || requestObject.outputFormat.gridColumns.length > 0)) {
            topLevelRequestObject.columnOptions.topXInfo = {};
          }
          let topLevelResult = reportDataService.fetchData(topLevelRequestObject, null, true);
          if (!topLevelResult || !_.size(topLevelResult.data)) {
            _this.isDataAvailable = false;
            return;
          }
          finalData.logicalDsInfo = topLevelResult.logicalDsInfo;
          let topLevelData = topLevelResult.data;
          if (requestObject.outputFormat.gridRows.length > 0 || requestObject.outputFormat.gridColumns.length > 0) {
            let temp = [];
            let finalData = [];
            _.each(_.concat(requestObject.outputFormat.gridRows, requestObject.outputFormat.gridColumns), function (attr, index) {
              temp.push(topLevelResult.appliedDisplayFilters[attr] ? _this.reportDataFilterService.filterData(topLevelResult[attr], topLevelResult.appliedDisplayFilters[attr]) : topLevelResult[attr]);
            });
            let vals = _this.commonUtilsService.cartesianProdOfArrOfObjs(temp);
            _.each(vals, function (val) {
              let tempData = _this.reportDataFilterService.getFilteredData(topLevelData, val);
              if (topLevelRequestObject.columnOptions && !_.isEmpty(topLevelRequestObject.columnOptions.topXInfo)) {
                tempData = _this.reportColumnService.applyTopOrBottom(tempData, topLevelRequestObject.columnOptions.topXInfo, topLevelRequestObject.outputFormat.columns)
              }
              finalData = _.concat(finalData, tempData);
            });
          }
          _this.nestedLevelsData['cols'] = topLevelResult.cols;
          _this.addLevelToData(topLevelData, parseInt(levelIndex));
          _this.nestedLevelsData[nestedHierarchyName].push(topLevelData);
        }
        let currentLevelRequestObject = _this.nestedGridService.changeRowHierarchyLevel(requestObject, nestedHierarchyName, parseInt(levelIndex) + 2);

        currentLevelRequestObject.allAttribsDataItemMap = reportDataService.getMetaData(currentLevelRequestObject) && reportDataService.getMetaData(currentLevelRequestObject).allAttribsDataItemMap;
        // if (currentLevelRequestObject.columnOptions && !_.isEmpty(currentLevelRequestObject.columnOptions.topXInfo)) {
        //   currentLevelRequestObject.columnOptions.topXInfo = {};
        // }
        currentLevelRequestObject.nestedFilters = null;
        let tempData = [];
        _.forOwn(filterValues, function (nestedFilterObj, nestedFilterKey) {
          currentLevelRequestObject.nestedFilters = nestedFilterObj;
          currentLevelRequestObject.nestedExpandedLevel = parseInt(levelIndex) + 2;
          let currentLevelResult = reportDataService.fetchData(currentLevelRequestObject, null, true);
          _.assign(finalData.logicalDsInfo, currentLevelResult.logicalDsInfo);
          tempData = _.concat(tempData, currentLevelResult.data);
        });
        // let currentLevelData = currentLevelesult.data;
        let currentLevelData = tempData;
        _this.addLevelToData(currentLevelData, parseInt(levelIndex) + 1);
        _this.nestedLevelsData[nestedHierarchyName].push(currentLevelData);
      });
    });
  }

  ReportAdditionalDataService.prototype.addLevelToData = function (data, level) {
    _.each(data, function (record, index) {
      record.level = level;
      record.index = index;
    });
  }

  ReportAdditionalDataService.prototype.addNameAndDescToData = function (data, requestObject, isRow) {
    let allAttribsDataItemMap = requestObject.allAttribsDataItemMap;
    let rowsOrCols = isRow ? _.intersection(_.difference(requestObject.outputFormat.rows, _.concat(requestObject.outputFormat.gridRows, requestObject.outputFormat.gridColumns)), requestObject.outputFormat.groupedAttrs) : requestObject.outputFormat.columns;
    let rowOrColIdItems = [];
    let rowOrColNameItems = [];
    _.each(rowsOrCols, function (row) {
      rowOrColIdItems = rowOrColIdItems.concat(_.map(allAttribsDataItemMap[row].idDataItems, function (x) {
        return x.name
      }));
      rowOrColNameItems = rowOrColNameItems.concat(_.map(allAttribsDataItemMap[row].displayDataItems, function (x) {
        return x.name
      }));
    });
    this.addPropToData(data, rowOrColIdItems, isRow ? 'name' : _.join(rowOrColIdItems, '_'));
    this.addPropToData(data, rowOrColNameItems, isRow ? 'description' : _.join(rowOrColNameItems, '_'));
  };

  ReportAdditionalDataService.prototype.addPropToData = function (data, props, propToAdd) {
    let _this = this;
    _.each(data, function (record) {
      record[propToAdd] = _this.transformService.getConcatenatedValues(record, props);
    });
  };

  ReportAdditionalDataService.prototype.getDataItems = function (attributes, allAttribsDataItemMap, dataItemProp, outputArray) {
    _.forEach(attributes, function (attribute) {
      let attrDataItems = allAttribsDataItemMap[attribute];
      let dataItems = _.map(attrDataItems[dataItemProp], function (dataItem) {
        return dataItem.name;
      });
      Array.prototype.push.apply(outputArray, dataItems);
    });
  };

  return ReportAdditionalDataService;
}());
exports.ReportAdditionalDataService = ReportAdditionalDataService;