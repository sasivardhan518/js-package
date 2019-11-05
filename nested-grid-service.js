"use strict";
let _ = require('lodash');
let transformServiceInstance = require("./report-data-transform-service");
let NestedGridService = (function () {

  function NestedGridService() {
    this.transformService = new transformServiceInstance.ReportTranformDataService();
  }

  NestedGridService.prototype.checkForNested = function (nestedHierarchies) {
    if (!_.isEmpty(nestedHierarchies)) {
      let expandedLevels = _.map(_.values(nestedHierarchies), function (x) {
        return x.hierarchyState.expandedLevels
      });
      let maxLevel = expandedLevels.sort().reverse()[0];
      if (maxLevel > 1) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  };

  NestedGridService.prototype.prepareNestedData = function (nestedHierarchies, mergedFormattedData, outputFormat, dataObject, reportService) {
    let uniqueHierarchyCombinations = {};
    _.each(nestedHierarchies, function (nestedHierarchy, key) {
      let uniqueCombs = _.cloneDeep(uniqueHierarchyCombinations);
      uniqueHierarchyCombinations = {};
      for (var i = 1; i <= nestedHierarchy.hierarchyState.expandedLevels; i++) {
        if (_.size(uniqueCombs)) {
          _.each(uniqueCombs, function (value, index) {
              uniqueHierarchyCombinations[index+ '_' + i] = null;
          });
        } else {
          uniqueHierarchyCombinations[i] = null;
        }
      }
    });
    let index = 0;
    if (!_.isEmpty(uniqueHierarchyCombinations)) {
      for (let i = 0; i < Object.keys(uniqueHierarchyCombinations).length; i++) {
        let uniqueHierarchyCombination = Object.keys(uniqueHierarchyCombinations)[i];
        let Hierarchylevels = uniqueHierarchyCombination.split('_');
        let tempObj = {};
        let requestObject = _.cloneDeep(dataObject);
        _.each(Object.keys(nestedHierarchies), function (nestedHierarchy, index) {
          let currentHierarchy = requestObject.reportInfo.reportInfo.hierarchies.find(function (x) {
            return x.hierarchyState.hierarchyKey == nestedHierarchy;
          });
          tempObj[nestedHierarchy] = parseInt(Hierarchylevels[index]);
          currentHierarchy.hierarchyState.expandedLevels = parseInt(Hierarchylevels[index]);
          let groupedAttributesToRemove = currentHierarchy.hierarchies.slice(Hierarchylevels[index], currentHierarchy.hierarchies.length);
          if (_.size(dataObject.groupInfo)) {
            _.forOwn(dataObject.groupInfo, function (artifactId, groupId) {
              let crntGroupIndex = _.indexOf(groupedAttributesToRemove, groupId);
              if (crntGroupIndex !== -1) {
                groupedAttributesToRemove.splice(crntGroupIndex, 1, artifactId);
              }
            });
          }
          requestObject.outputFormat.groupedAttrs = _.difference(requestObject.outputFormat.groupedAttrs, groupedAttributesToRemove);
        });
        if (reportService.searchInMemory(requestObject)) {
          index = i === 0 ? reportService.currentLevelIndex : index;
        } else {
          let tempData = _.cloneDeep(mergedFormattedData);
          tempData.data = reportService.filterService.getFilteredData(mergedFormattedData.data, tempObj);
          var dataLevel = {
            metaData: requestObject,
            data: tempData
          };
          index = i === 0 ? reportService.allLevelData.length : index;
          reportService.allLevelData.push(dataLevel);
          reportService.currentLevelIndex = reportService.allLevelData.length - 1;
        }
      }
    } else if (_.size(mergedFormattedData.data)) {
      var dataLevel = {
        metaData: _.cloneDeep(dataObject),
        data: _.cloneDeep(mergedFormattedData)
      };
      reportService.allLevelData.push(dataLevel);
      reportService.currentLevelIndex = reportService.allLevelData.length - 1;
    } else {
      var dataLevel = {
        metaData: this.resetNestedInfo(dataObject, nestedHierarchies),
        data: _.cloneDeep(mergedFormattedData)
      };
      reportService.allLevelData.push(dataLevel);
      reportService.currentLevelIndex = reportService.allLevelData.length - 1;
    }
    if (_.isEmpty(dataObject.nestedFilters)) {
      reportService.currentLevelIndex = index;
      mergedFormattedData.data = (reportService.allLevelData && reportService.allLevelData[index] && reportService.allLevelData[index].data && reportService.allLevelData[index].data.data) || [];
      outputFormat = reportService.allLevelData[index] && reportService.allLevelData[index].metaData && reportService.allLevelData[index].metaData.outputFormat;
    } else {
      mergedFormattedData = reportService.searchInMemory(dataObject);
      let currentLevel = reportService.getCurrentLevelData();
      outputFormat = currentLevel.metaData.outputFormat;
    }
    return {
      mergedFormattedData: mergedFormattedData,
      outputFormat: outputFormat
    }
  };

  NestedGridService.prototype.resetNestedInfo = function (requestObject, nestedHierarchies) {
    requestObject = _.cloneDeep(requestObject);
    let _this = this;
    _.each(Object.keys(nestedHierarchies), function (nestedHierarchy, index) {
      let currentHierarchy = requestObject.reportInfo.reportInfo.hierarchies.find(function (x) {
        return x.hierarchyState.hierarchyKey == nestedHierarchy;
      });
      currentHierarchy.hierarchyState.expandedLevels = 1;
      let groupedAttributesToRemove = _this.getGroupedAttributesToRemove(1, currentHierarchy, requestObject);
      requestObject.outputFormat.groupedAttrs = _.difference(requestObject.outputFormat.groupedAttrs, groupedAttributesToRemove);
    });
    return requestObject;
  };

  NestedGridService.prototype.changeRowHierarchyLevel = function (requestObject, rowHierarchyName, level) {
    let _this = this;
    let tempObject = _.cloneDeep(requestObject);
    let currentHierarchy = tempObject.reportInfo.reportInfo.hierarchies.find(function (x) {
      return x.hierarchyState.hierarchyKey == rowHierarchyName;
    });
    currentHierarchy.hierarchyState.expandedLevels = level;
    let groupedAttributesToRemove = _this.getGroupedAttributesToRemove(level, currentHierarchy, requestObject);
    let groupedAttributesToAdd = _this.getGroupedAttributesToAdd(level, currentHierarchy, requestObject);
    tempObject.outputFormat.groupedAttrs = _.difference(_.union(tempObject.outputFormat.groupedAttrs, groupedAttributesToAdd), groupedAttributesToRemove);
    return tempObject;
  };

  NestedGridService.prototype.getGroupedAttributesToRemove = function (level, currentHierarchy, requestObject) {
    let groupedAttributesToRemove = currentHierarchy.hierarchies.slice(level, currentHierarchy.hierarchies.length);
    _.forEach(groupedAttributesToRemove, function (groupedAttribute, indx) {
      if (requestObject.groupInfo[groupedAttribute]) {
        groupedAttributesToRemove.splice(indx, 1, requestObject.groupInfo[groupedAttribute]);
      }
    });
    return groupedAttributesToRemove;
  };

  NestedGridService.prototype.getGroupedAttributesToAdd = function (level, currentHierarchy, requestObject) {
    let groupedAttributesToAdd = _.filter(currentHierarchy.hierarchies, function (hier, indx) {
      return indx < level;
    });
    _.forEach(groupedAttributesToAdd, function (groupedAttribute, indx) {
      if (requestObject.groupInfo[groupedAttribute]) {
        groupedAttributesToAdd.splice(indx, 1, requestObject.groupInfo[groupedAttribute]);
      }
    });
    return groupedAttributesToAdd;
  };

  return NestedGridService;
}());
exports.NestedGridService = NestedGridService;