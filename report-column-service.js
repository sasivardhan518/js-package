"use strict";
let _ = require('lodash');
let moment = require('moment');
var Defaults = require('./defaults').defaults;
let searchFilterServiceInstance = require('./search-filter-service');
let displayFilterServiceInstance = require('./report-display-filter-service');
let commonUtilsServiceInstance = require('./common-utils-service');
let ColumnService = (function () {
  function ColumnService() {
    this.sortedData = [];
    this.searchFilterService = new searchFilterServiceInstance.SearchFilterService();
    this.displayFilterService = new displayFilterServiceInstance.DisplayFilterService();
    this.commonUtilsService = new commonUtilsServiceInstance.CommonUtilsService();
  }
  ColumnService.prototype.getSortedData = function (data, displayFilterAttributeProps, columns, sortOrders, rowAttribCols, allAttribsDataItemMap, newAttrValsObj, propsPathArray, displayFiltersPassed) {
    this.sortedData = [];
    this.applyGroupSort(data, displayFilterAttributeProps, 0, columns, sortOrders, rowAttribCols, allAttribsDataItemMap, newAttrValsObj, propsPathArray, displayFiltersPassed)
    return this.sortedData;
  };
  ColumnService.prototype.applyGroupSort = function (data, displayFilterAttributeProps, index, columns, sortOrders, rowAttribCols, allAttribsDataItemMap, newAttrValsObj, propsPathArray, displayFiltersPassed) {
    let _this = this;
    if (index == displayFilterAttributeProps.length) {
      let sortProps = this.getPropsToSort(columns, allAttribsDataItemMap, newAttrValsObj, rowAttribCols, propsPathArray, sortOrders);
      sortOrders = sortProps.sortOrders;
      var tempData = _.orderBy(data, sortProps.propsArray, sortOrders);
      _this.sortedData = _.concat(_this.sortedData, tempData);
    } else {
      let groups = _.groupBy(data, function (record) {
        return _.values(_.pick(_.size(propsPathArray) ? _.get(record, _.join(propsPathArray, '.')) : record, displayFilterAttributeProps[index])).join('_') + '_';
      });
      let displayFilterPassedForCurrentIndex = _.groupBy(displayFiltersPassed[index], function (x) {
        return _.values(x).join('_') + '_';
      })
      let dataKeys = _.keys(groups);
      let displayOrderKeys = _.keys(displayFilterPassedForCurrentIndex);
      let finalOrderKeys = _.union(displayOrderKeys, dataKeys);
      _.forEach(finalOrderKeys, function (finalOrderKey) {
        _this.applyGroupSort(groups[finalOrderKey], displayFilterAttributeProps, index + 1, columns, sortOrders, rowAttribCols, allAttribsDataItemMap, newAttrValsObj, propsPathArray, displayFiltersPassed);
      });
    }
  };


  ColumnService.prototype.getSortedDataInOrder = function (data, dataColumnProps, dataColumns, sortOrders, rowAttribCols, allAttribsDataItemMap, newAttrValsObj, propsPathArray, displayFiltersPassed) {
    this.sortedData = [];
    this.applyGroupSortInOrder(data, dataColumnProps, 0, dataColumns, sortOrders, rowAttribCols, allAttribsDataItemMap, newAttrValsObj, propsPathArray, displayFiltersPassed)
    return this.sortedData;
  };

  ColumnService.prototype.applyGroupSortInOrder = function (data, dataColumnProps, index, dataColumns, sortOrders, rowAttribCols, allAttribsDataItemMap, newAttrValsObj, propsPathArray, displayFiltersPassed) {
    let _this = this;
    let dataColumn = dataColumns[index];
    let groups = {};
    let displayOrderKeys = [];
    let dataKeys = [];
    let finalOrderKeys = [];
    if (_.size(displayFiltersPassed[index])) {
      let displayFilterPassedForCurrentIndex = _.groupBy(displayFiltersPassed[index], function (x) {
        return _.values(x).join('_') + '_';
      })
      displayOrderKeys = _.keys(displayFilterPassedForCurrentIndex);
    } else {
      let props = ['level', dataColumn];
      let sortProps = this.getPropsToSort(props, allAttribsDataItemMap, newAttrValsObj, rowAttribCols, propsPathArray, sortOrders);
      let currentSortOrders = sortProps.sortOrders;
      data = _.orderBy(data, sortProps.propsArray, currentSortOrders);
    }
    groups = _.groupBy(data, function (record) {
      return _.values(_.pick(_.size(propsPathArray) ? _.get(record, _.join(propsPathArray, '.')) : record, _.size(dataColumnProps[index]) ? dataColumnProps[index] : dataColumn)).join('_') + '_';
    });
    dataKeys = _.keys(groups);
    finalOrderKeys = _.union(displayOrderKeys, dataKeys);
    let levelIndex = _.indexOf(finalOrderKeys, '_');
    if (levelIndex !== -1 && _.size(finalOrderKeys)) {
      finalOrderKeys.splice(levelIndex, 1);
      finalOrderKeys.unshift('_');
    }
    if (index === dataColumns.length) {
      _this.sortedData = _.concat(_this.sortedData, data);
    } else {
      for (let finalOrderKeyIndex = 0; finalOrderKeyIndex < finalOrderKeys.length; finalOrderKeyIndex++) {
        let finalOrderKey = finalOrderKeys[finalOrderKeyIndex];
        _this.applyGroupSortInOrder(groups[finalOrderKey], dataColumnProps, index + 1, dataColumns, sortOrders, rowAttribCols, allAttribsDataItemMap, newAttrValsObj, propsPathArray, displayFiltersPassed);
      }
    }
  };

  ColumnService.prototype.getPropsToSort = function (columns, allAttribsDataItemMap, newAttrValsObj, rowAttribCols, propsPathArray, passedSortOrders) {
    let propsArray = [];
    let sortOrders = [];
    propsPathArray = propsPathArray || [];
    let _this = this;
    _.each(columns, function (column, index) {
      if (_.has(rowAttribCols, column) || _.isEmpty(rowAttribCols) || !rowAttribCols) {
        if (allAttribsDataItemMap[column]) {
          let idItemNames = _.map(allAttribsDataItemMap[column].idDataItems, function (idDataItem) {
            return idDataItem.name;
          });
          let sortItem = allAttribsDataItemMap[column].sortDataItems[0];
          let dataType = sortItem.dataType;
          if (dataType.toLowerCase() === 'datetime') {
            sortOrders.push(passedSortOrders && passedSortOrders[index] || 'asc');
            propsArray.push(function (x) {
              let uniqueIdVals = _.uniq(_.values(_.pick(_.size(propsPathArray) ? _.get(x, _.join(propsPathArray, '.')) : x, idItemNames)));
              if (newAttrValsObj && newAttrValsObj[column] && _.size(uniqueIdVals) === 1 && _.keys(newAttrValsObj[column]).indexOf(uniqueIdVals[0].toString()) !== -1 && newAttrValsObj[column][uniqueIdVals[0]]) {
                let newAttribVal = newAttrValsObj[column][uniqueIdVals[0]][sortItem.name];
                return newAttribVal ? moment(newAttribVal).isValid() ? moment(newAttribVal) + 1 : moment(newAttribVal, sortItem.format) + 1 : true;
              } else {
                let propsPath = _.concat(propsPathArray, [sortItem.name]);
                return _this.getPropsPath(x, propsPath) ? 
                moment(_this.getPropsPath(x, propsPath)).isValid() ? moment(_this.getPropsPath(x, propsPath)) + 0 : moment(_this.getPropsPath(x, propsPath), sortItem.format) + 0 : 
                (_.last(sortOrders) === 'asc' ? Defaults.MaxDateValue  : Defaults.MinDateValue);
              }
            });
          } else {
            sortOrders.push(passedSortOrders && passedSortOrders[index] || 'asc');
            propsArray.push(function (x) {
              let propsPath = _.concat(propsPathArray, [sortItem.name]);
              return _this.getPropsPath(x, propsPath) == null ?
                (dataType.toLowerCase() === 'string' ?
                  (_.last(sortOrders) === 'asc' ? Defaults.highestStringValue : Defaults.lowestStringValue) : (_.last(sortOrders) === 'asc' ? Infinity : -Infinity)) :
                (dataType.toLowerCase() === 'string' ?
                  _this.getPropsPath(x, propsPath).toString().toLowerCase() : _this.getPropsPath(x, propsPath));
            });
          }
        } else {
          sortOrders.push(passedSortOrders && passedSortOrders[index] || 'asc');
          propsArray.push(function (x) {
            return x[column] == null ? (_.last(sortOrders) === 'desc' ? -Infinity : Infinity) : x[column];
          });
        }
      } else {
        sortOrders.push(passedSortOrders && passedSortOrders[index] || 'desc');
        propsArray.push(function (x) {
          return x[column] == null ? (_.last(sortOrders) === 'desc' ? -Infinity : Infinity) : x[column];
        });
      }
    });
    return {
      propsArray: propsArray,
      sortOrders: sortOrders
    };
  };

  ColumnService.prototype.getPropsPath = function (obj, propsPath) {
    return _.get(obj, _.join(_.concat(propsPath), '.'));
  }

  ColumnService.prototype.applyTopOrBottom = function (data, topCriteria, columns) {
    var topData = data;
    if (topCriteria && !_.isEmpty(topCriteria)) {
      if (!_.isEqual(topCriteria.columns, columns)) {
        return topData;
      }
      let tempData = [];
      let topValues = _.sortBy(_.compact(_.map(topData, topCriteria.topAppliedColumn)));
      topValues = _.uniq(topValues);
      if (topCriteria.topType.toLowerCase() == 'top') {
        topValues = topValues.reverse();
      }
      topValues.splice(topCriteria.topValue, topValues.length > topCriteria.topValue ? topValues.length - topCriteria.topValue : 0);
      if (_.size(topValues)) {
        for (let i = 0; i < topValues.length; i++) {
          let value = topValues[i];
          tempData = tempData.concat(_.filter(topData, function (x) {
            return x[topCriteria.topAppliedColumn] == value
          }));
          if (tempData.length > topCriteria.topValue) {
            tempData.splice(topCriteria.topValue, tempData.length - topCriteria.topValue);
            break;
          }
        }
        topData = tempData;
      }
    }
    return topData;
  };

  ColumnService.prototype.getSearchResults = function (data, searchList, searchLogicalCondition) {
    let availableColumnFields = _.uniq(_.flattenDeep(_.map(data, _.keys)));
    let filterAppliedColumnFields = _.map(searchList, 'field');
    let unavailableColumnFields = _.difference(filterAppliedColumnFields, availableColumnFields);
    if (unavailableColumnFields.length > 0) {
      searchList = _.filter(searchList, function (x) {
        return unavailableColumnFields.indexOf(x.field) === -1
      });
    }
    if (searchList.length === 0) {
      return data;
    }
    return this.searchFilterService.getSearchResults(data, searchList, searchLogicalCondition);
  }

  ColumnService.prototype.getColorColumnRangeSet = function (data, colIds, partitionCount, min, max) {
    let colorColumnRangeSet = {};
    let _this = this;
    _.each(colIds, function (colId) {
      let currentColValues = _.map(data, function (record) {
        return record[colId]
      });
      currentColValues = _.reject(currentColValues, _.isUndefined);
      currentColValues = _.reject(currentColValues, _.isNull);
      let minAndMaxValues = _this.getMaxAndMinValues(currentColValues, partitionCount, min, max);
      colorColumnRangeSet[colId] = _this.getRangeSet(minAndMaxValues, partitionCount);
    });
    return colorColumnRangeSet;
  };

  ColumnService.prototype.getMaxAndMinValues = function (collectedValues, partitionCount, min, max) {
    let minValue, maxValue;
    // if (collectedValues.length > partitionCount) {
    if (collectedValues.length > 9) {
      let skipCount = collectedValues.length / partitionCount;
      collectedValues = _.sortBy(collectedValues);
      let firstPercentile = parseInt(Math.floor(skipCount));
      minValue = (min || min === 0) ? min : _.last(_.take(collectedValues, firstPercentile));
      let lastPercentile = parseInt(Math.ceil((skipCount * (partitionCount - 1))));
      maxValue = (max || max === 0) ? max : _.first(_.takeRight(collectedValues, collectedValues.length - lastPercentile));
    } else {
      minValue = (min || min === 0) ? min : _.min(collectedValues);
      maxValue = (max || max === 0) ? max : _.max(collectedValues);
    }
    return {
      min: minValue,
      max: maxValue
    };
  };

  ColumnService.prototype.getRangeSet = function (maxAndMin, partitionCount) {
    let minValue = maxAndMin.min;
    let maxValue = maxAndMin.max;
    let dataMaxValue = Number.MAX_SAFE_INTEGER;
    let dataMinValue = Number.MIN_SAFE_INTEGER;
    let range = maxValue - minValue;
    let delta = Math.abs(range / partitionCount);
    let previousGradientVal = maxValue - delta;
    let rangeSet = [];
    rangeSet.push(new RangeSet(previousGradientVal, dataMaxValue, rangeSet.length + 1));

    for (let count = 2; count < partitionCount; count++) {
      let currentGradient = maxValue - count * delta;
      rangeSet.push(new RangeSet(currentGradient, previousGradientVal, rangeSet.length + 1));
      previousGradientVal = currentGradient;
    }
    rangeSet.push(new RangeSet(dataMinValue, previousGradientVal, rangeSet.length + 1));
    return rangeSet;
  };

  ColumnService.prototype.getColorColumnFunctionColor = function (value, rangeSet, startColor, endColor, partitionCount) {
    let slotNumber, gradientColor;
    for (let i = 0; i < rangeSet.length; i++) {
      let currentRangeSet = rangeSet[i];
      if (value >= currentRangeSet.min && value < currentRangeSet.max) {
        slotNumber = currentRangeSet.slotNumber;
        break;
      }
    }
    if (slotNumber) {
      gradientColor = this.commonUtilsService.getGradientColor(startColor, endColor, partitionCount, slotNumber);
    }
    return gradientColor;
  };

  function RangeSet(min, max, slotNumber) {
    this.min = min;
    this.max = max;
    this.slotNumber = slotNumber;
  }

  return ColumnService;
}());
exports.ColumnService = ColumnService;