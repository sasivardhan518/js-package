"use strict";
exports.__esModule = true;
var _ = require("lodash");
var moment = require("moment");
var _common_utils = require('./common-utils-service');
var Defaults = require('./defaults').defaults;
var ReportDataMergeService = /** @class */ (function () {
  function ReportDataMergeService() {
    this.commonUtilsService = new _common_utils.CommonUtilsService();
  }

  ReportDataMergeService.prototype.merge = function (serverData, reportMetaData, uniqObj, allAttribsDataItemMap, nestedHierarchies, groupInfo) {
    var mergeObject = {
      data: [],
      MEASURE: []
    };
    if (!(serverData.resultData && serverData.resultData._data)) {
      return mergeObject;
    }
    mergeObject.data = this.mergeServerData(serverData.resultData._data, serverData.resultData.attribColumns, serverData.resultData.measureColumns, serverData.resultData.columnMap, uniqObj, allAttribsDataItemMap, nestedHierarchies);
    this.convertAndMergeUniqueValues(serverData, mergeObject, uniqObj, allAttribsDataItemMap, groupInfo);
    this.mergeMeasuresIntoUniqueValues(mergeObject, reportMetaData, serverData.kpiDetails);
    return mergeObject;
  };

  ReportDataMergeService.prototype.mergeServerData = function (data, attrs, measures, columnMap, newAttribValsInfo, allAttribsDataItemMap, nestedHierarchies) {
    var uiData = [];
    let _this = this;
    let newAttrValues = {};
    for (let recordIndex = 0; recordIndex < data.length; recordIndex++) {
      let record = data[recordIndex];
      var uiRecord = {};
      for (let attrIndex = 0; attrIndex < attrs.length; attrIndex++) {
        let attr = attrs[attrIndex];
        uiRecord[attr] = record[columnMap[attr]];
      }
      if (_.size(newAttribValsInfo)) {
      let attributes = _.keys(allAttribsDataItemMap);
      for (let attributeIndex = 0; attributeIndex < attributes.length; attributeIndex++) {
        let attribute = attributes[attributeIndex];
        if (newAttribValsInfo[attribute] && newAttribValsInfo[attribute][record[columnMap[attribute]]]) {
          let idItemNames = _.map(allAttribsDataItemMap[attribute].idDataItems, function (x) {
            return x.name
          });
          let displayItemNames = _.map(allAttribsDataItemMap[attribute].displayDataItems, function (x) {
            return x.name
          });
          if (_.isEqual(idItemNames.sort(), displayItemNames.sort())) {
            uiRecord[attribute] = newAttribValsInfo[attribute][record[columnMap[attribute]]];
          } else {
            uiRecord[attribute] = record[columnMap[attribute]];
          }
          }
        }
      }
      _.forOwn(nestedHierarchies, function (nestedHierarchy, hierarchyName) {
        // uiRecord[hierarchyName] = this.commonUtilsService(record[columnMap[hierarchyName]]);
        if (_.isNull(record[columnMap[hierarchyName]]) || _.isUndefined(record[columnMap[hierarchyName]])) {
          uiRecord[hierarchyName] = 1;
        } else {
          let binary = _this.commonUtilsService.getBinaryValue(record[columnMap[hierarchyName]]);
          let noOfAttributesInHierarchy = nestedHierarchy.hierarchies.length;
          let noOfOnes = _.countBy(binary)[1];
          uiRecord[hierarchyName] = noOfAttributesInHierarchy - (noOfOnes ? noOfOnes : 0);
        }
      });
      if (columnMap.logicalDs) {
        uiRecord['logicalDs'] = JSON.parse(record[columnMap['logicalDs']]);
      }
      if (_.size(measures)) {
        for (let msrIndex = 0; msrIndex < measures.length; msrIndex++) {
          let measure = measures[msrIndex];
          var measureRecord = _.cloneDeep(uiRecord);
          measureRecord[MeasureAttributeEnum.Name] = measure;
          measureRecord['value'] = record[columnMap[measure]];
          uiData.push(measureRecord);
        }
      } else {
        uiData.push(_.cloneDeep(uiRecord));
      }
    }
    return uiData;
  };

  ReportDataMergeService.prototype.convertAndMergeUniqueValues = function (dataToMerge, result, uniqObj, allAttribsDataItemMap, groupInfo) {
    if (result) {
      result.newAttrValues = [];
    }
    var _this = this;
    let newAttribUniqueVals = {};
    for (let uniqLblIndx = 0; uniqLblIndx < dataToMerge['uniqueLabelValues'].length; uniqLblIndx++) {
      let attrResponse = dataToMerge['uniqueLabelValues'][uniqLblIndx];
      result[attrResponse.requestedAttrib] = allAttribsDataItemMap[attrResponse.requestedAttrib] ? _this.convertUniqueVals(attrResponse.resultData._data, attrResponse.labelDetails, allAttribsDataItemMap[attrResponse.requestedAttrib], attrResponse.resultData.attribColumns, attrResponse.resultData.columnMap) : [];
      if (!allAttribsDataItemMap[attrResponse.requestedAttrib]) {
        continue;
      }
      // if (_.size(attrResponse.propertyToColumnMapping)) {
      //   _.forOwn(attrResponse.propertyToColumnMapping, function (value, key) {
      //     let displayItems = allAttribsDataItemMap[attrResponse.requestedAttrib].displayDataItems;
      //     if (key.toString().toLowerCase() === 'name') {
      //       _.forEach(result[attrResponse.requestedAttrib], function (unqiueValue, uniqueValueIndex) {
      //         _.forEach(displayItems, function (displayItem, diaplyItemIndex) {
      //           unqiueValue[displayItem.name] = unqiueValue[value];
      //         });
      //       });
      //     }
      //   })
      // }
      if (uniqObj[attrResponse.requestedAttrib]) {

        _.forOwn(uniqObj[attrResponse.requestedAttrib], function (value, key) {
          let groupId = _this.commonUtilsService.getKeyFromValue(groupInfo, attrResponse.requestedAttrib);
          let idItemNames = _.map(allAttribsDataItemMap[attrResponse.requestedAttrib].idDataItems, function (x) {
            return x.name
          });
          let displayItemNames = _.map(allAttribsDataItemMap[attrResponse.requestedAttrib].displayDataItems, function (x) {
            return x.name
          });
          let colorDataItems = allAttribsDataItemMap[attrResponse.requestedAttrib].colorDataItems;
          let colorItemNames = colorDataItems ? _.map(allAttribsDataItemMap[attrResponse.requestedAttrib].colorDataItems, function (x) {
            return x.name;
          }) : null;
          let tempObj = {};
          if (_.isEqual(idItemNames.sort(), displayItemNames.sort())) {
            _.each(idItemNames, function (x) {
              tempObj[x] = value;
            });
            _.each(colorItemNames, function (colorItem) {
              tempObj[colorItem] = _this.commonUtilsService.getColor(_.size(result[attrResponse.requestedAttrib]));
            });
          } else {
            _.each(idItemNames, function (x) {
              tempObj[x] = key;
              if (groupId) {
                tempObj[groupId] = key;
              }
            });
            _.each(displayItemNames, function (x) {
              tempObj[x] = value;
              if (groupId) {
                tempObj[groupId + Defaults.defaultNameProperty] = value;
              }
            });
            _.each(colorItemNames, function (colorItem) {
              tempObj[colorItem] = _this.commonUtilsService.getColor(_.size(result[attrResponse.requestedAttrib]));
            });
            if (!newAttribUniqueVals.hasOwnProperty(attrResponse.requestedAttrib)) {
              newAttribUniqueVals[attrResponse.requestedAttrib] = [];
              newAttribUniqueVals[attrResponse.requestedAttrib].push(tempObj);
            } else {
              newAttribUniqueVals[attrResponse.requestedAttrib].push(tempObj);
            }
          }
          result[attrResponse.requestedAttrib].push(tempObj);
          result.newAttrValues.push(tempObj);
        });
      }
    }
    result.newAttrUniqueValues = newAttribUniqueVals;
    return result;
  };

  ReportDataMergeService.prototype.mergeMeasuresIntoUniqueValues = function (resultData, reportMetaData, kpiDetails) {
    resultData[MeasureAttributeEnum.Name] = [];
    var tempArr = [];
    if (!kpiDetails) {
      reportMetaData.reportInfo.kpIs.forEach(function (kpi) {
        var _a;
        tempArr.push((_a = {},
          _a[MeasureAttributeEnum.Name] = kpi.parameters[MeasureAttributeEnum.MeasureName],
          _a[MeasureAttributeEnum.Description] = kpi.name // kpi.parameters.description,
          ,
          _a));
      });
    } else {
      _.each(kpiDetails, function (kpi) {
        let tempMetric = {};
        tempMetric[MeasureAttributeEnum.Name] = kpi.columnName;
        tempMetric[MeasureAttributeEnum.Description] = kpi.measureName;
        tempArr.push(tempMetric);
      });
    }
    resultData[MeasureAttributeEnum.Name] = tempArr;
  };
  ReportDataMergeService.prototype.convertUniqueVals = function (data, labelDetails, attributeDataItems, attrs, columnMap) {
    console.time('uniqueValues');
    let _this = this;
    var uiData = [];
    let idItems = _.map(attributeDataItems.idDataItems, function (idDataItem) {
      return idDataItem.name;
    });
    _.each(data, function (record, recordIndex) {
      var uiRecord = {};
      // TO DO: 
      // need to depend only on label details.
      // for now label details are not being sent for totals thing
      if (labelDetails) {
        var formatColumn = _.find(labelDetails, function (labelDetail) {
          return labelDetail.name.toLowerCase() === 'format' && labelDetail.labelType === Defaults.labelTypes.propertyLabel;
        });
        var formatColumnIndex = formatColumn ? formatColumn.columns[0].columnIndex : null;
        _.each(labelDetails, function (labelDetail) {
          let propertyLabelType = labelDetail.labelType === Defaults.labelTypes.propertyLabel ? labelDetail.name : 'id';
          let isGroupLabel = labelDetail.labelType === Defaults.labelTypes.groupLabel;
          if (!isGroupLabel) {
            _.forEach(labelDetail.columns, function (column) {
              switch (propertyLabelType.toLowerCase()) {
                case 'name':
                  let displayItem = attributeDataItems.displayDataItems[0].name;
                  if (!uiRecord[displayItem]) {
                    uiRecord[displayItem] = _this.commonUtilsService.isValidValue(record[column.columnIndex]) ? record[column.columnIndex] : _this.commonUtilsService.getConcatenatedValues(uiRecord, idItems);
                  }
                  if (formatColumnIndex && record[formatColumnIndex] && uiRecord[displayItem]) {
                    uiRecord[displayItem] = moment(uiRecord[displayItem]).isValid() ? moment(uiRecord[displayItem]).format(record[formatColumnIndex]) : uiRecord[displayItem];
                  }
                  break;
                case 'color':
                  let colorItem = attributeDataItems.colorDataItems && attributeDataItems.colorDataItems[0] && attributeDataItems.colorDataItems[0].name;
                  if (colorItem && !uiRecord[colorItem]) {
                    uiRecord[colorItem] = record[column.columnIndex] || _this.commonUtilsService.getColor(recordIndex);
                  } else {
                    uiRecord[column.columnName] = record[column.columnIndex] || _this.commonUtilsService.getColor(recordIndex);
                  }
                  break;
                case 'sort':
                  let sortItem = attributeDataItems.sortDataItems[0].name;
                  if (!uiRecord[sortItem]) {
                    uiRecord[sortItem] = record[column.columnIndex];
                  }
                  break;
                default:
                  uiRecord[column.columnName] = record[column.columnIndex];
                  break;
              }
            });
          } else {
            _.each(attrs, function (attr) {
              uiRecord[attr] = record[columnMap[attr]];
            });
            if (_.size(attrs) === 1) {
              uiRecord[attrs[0] + '_desc'] = record[columnMap[attrs[0]]];
            }
          }
        });
        uiData.push(uiRecord);
      } else {
        _.each(attrs, function (attr) {
          uiRecord[attr] = record[columnMap[attr]];
        });
        if (_.size(attrs) === 1) {
          uiRecord[attrs[0] + '_desc'] = record[columnMap[attrs[0]]];
        }
        uiData.push(uiRecord);
      }
    });
    console.timeEnd('uniqueValues');
    return uiData;
  };
  ReportDataMergeService.prototype.mergeTablesBasedOnRows = function (primaryData, nextLevelData, attrs) {
    var _loop_1 = function (i) {
      var record = _.find(nextLevelData, function (rec) {
        return _.isMatch(rec, _.pick(primaryData[i], attrs));
      });
      if (record) {
        _.assign(primaryData[i], record);
      }
    };
    for (var i = 0; i < primaryData.length; i++) {
      _loop_1(i);
    }
  };
  return ReportDataMergeService;
}());
exports.ReportDataMergeService = ReportDataMergeService;
var MeasureAttributeEnum;
(function (MeasureAttributeEnum) {
  MeasureAttributeEnum["Name"] = "MEASURE";
  MeasureAttributeEnum["Description"] = "MEASURE_DESC";
  MeasureAttributeEnum["MeasureName"] = "MeasureName";
})(MeasureAttributeEnum = exports.MeasureAttributeEnum || (exports.MeasureAttributeEnum = {}));