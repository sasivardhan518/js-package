"use strict";
let _ = require('lodash');
let CommonUtilsServiceInstance = require('./common-utils-service');
let DisplayFilterService = (function () {
    function DisplayFilterService() {
        this.commonUtilsService = new CommonUtilsServiceInstance.CommonUtilsService();
    }
    DisplayFilterService.prototype.createDisplayFilters = function (mergedFormattedData, displayFilters, allAttribsDataItemMap) {
        let appliedDisplayFilters = {};
        let appliedDisplayFiltersForUI = {};
        let _this = this;
        _.forOwn(displayFilters, function (value, key) {
            if (!allAttribsDataItemMap[key]) {
                return;
            }
            let idItems = _.map(allAttribsDataItemMap[key]['idDataItems'], 'name');
            let allFilterValues = _.map(mergedFormattedData[key], function (x) {
                return _.pick(x, idItems)
            });
            let orderedValues = _.size(value.orderedValues) ? _.intersectionWith(value.orderedValues, allFilterValues, _.isEqual) : [];
            let showValues = _.size(value.showValues) ? _this.commonUtilsService.getIntersectedValues(mergedFormattedData[key], _.differenceWith(value.showValues, value.hiddenValues, _.isEqual), idItems, true) : [];
            let tempFilters = _.size(orderedValues) ? _this.commonUtilsService.getIntersectedValues(mergedFormattedData[key], _.unionWith(orderedValues, allFilterValues, _.isEqual), idItems, true) : allFilterValues;
            let showFilters = _.size(showValues) ? _.intersectionWith(tempFilters, showValues, _.isEqual) : tempFilters;
            let hiddenFilters = _.size(value.hiddenValues) ? _.differenceWith(tempFilters, value.hiddenValues, _.isEqual) : tempFilters;
            appliedDisplayFilters[key] = _.size(showValues) ? showFilters : hiddenFilters;
            appliedDisplayFiltersForUI[key] = {
                hiddenValues: _.size(value.hiddenValues) ? _.compact(_this.commonUtilsService.getIntersectedValues(mergedFormattedData[key], value.hiddenValues, idItems)) : [],
                showValues: _.size(value.showValues) ? _.compact(_this.commonUtilsService.getIntersectedValues(mergedFormattedData[key], value.showValues, idItems)) : [],
                orderedValues: _.size(value.orderedValues) ? _.compact(_this.commonUtilsService.getIntersectedValues(mergedFormattedData[key], value.orderedValues, idItems)) : [],
                resultValues: _.compact(_this.commonUtilsService.getIntersectedValues(mergedFormattedData[key], hiddenFilters, idItems))
            };
        });

        return {
            appliedDisplayFilters: appliedDisplayFilters,
            appliedDisplayFiltersForUI: appliedDisplayFiltersForUI
        }
    };

    DisplayFilterService.prototype.getUpdatedDisplayFilterAttributesAndSortInfo = function (displayFiltersPassed, sortInfo, outputFormat, allAttribsDataItemMap) {
        if (!(sortInfo && _.size(sortInfo.sortedColumns) > 0)) {
            return null;
        }
        let self = this;
        let displayFilters = _.cloneDeep(_.pick(displayFiltersPassed, outputFormat.rows));
        let displayFilterAttributesWithSort = [];
        let displayFilterAttributesWithoutSort = [];
        let displayFilterAttributes = [];
        _.forOwn(displayFilters, function (value, key) {
            if (_.size(value.orderedValues) == 0) {
                return;
            }
            if (value.enableSort) {
                displayFilterAttributesWithSort.push(key);
            } else {
                displayFilterAttributesWithoutSort.push(key);
            }
        });
        let sortedColumns = [];
        for (let i = 0; i < sortInfo.sortedColumns.length; i++) {
            let sortedColumn = sortInfo.sortedColumns[i];
            if (!sortedColumn.isRowAttribute) {
                sortedColumns.push(sortedColumn);
            } else {
                let sortedAttribute = this.getAttributeBasedOnNamedItem(sortedColumn.colId, allAttribsDataItemMap);
                if (displayFilterAttributesWithoutSort.indexOf(sortedAttribute) == -1) {
                    sortedColumns.push(sortedColumn);
                    displayFilterAttributesWithSort = _.differenceWith(displayFilterAttributesWithSort, [sortedAttribute]);
                }
            }
        }
        sortInfo.sortedColumns = sortedColumns;
        // displayFilterAttributes = _.union(displayFilterAttributesWithoutSort, displayFilterAttributesWithSort);
        displayFilterAttributes = displayFilterAttributesWithoutSort;
        return {
            sortInfo: sortInfo,
            displayFilterAttributes: displayFilterAttributes
        }
    };

    DisplayFilterService.prototype.updateFormatForDisplayFilters = function (displayFiltersPassed, sortInfo, outputFormat, allAttribsDataItemMap) {
        if (sortInfo && _.size(sortInfo.sortedColumns) > 0 && displayFiltersPassed && _.size(_.keys(displayFiltersPassed)) > 0) {
            let updatedInfo = sortInfo ? this.getUpdatedDisplayFilterAttributesAndSortInfo(displayFiltersPassed, sortInfo, outputFormat, allAttribsDataItemMap) : null;
            if (updatedInfo) {
                sortInfo = updatedInfo.sortInfo;
                let tempFormat = _.cloneDeep(outputFormat);
                let rows = outputFormat.rows;
                let displayFilterAttributes = updatedInfo.displayFilterAttributes;
                if (rows.length != displayFilterAttributes.length) {
                    let rowsInOrder = _.union(displayFilterAttributes, rows);
                    outputFormat.rows = rowsInOrder;
                }
            }
        }
        return outputFormat;
    };
    DisplayFilterService.prototype.getAttributeBasedOnNamedItem = function (namedItem, allAttribsDataItemMap) {
        for (let j = 0; j < _.size(_.keys(allAttribsDataItemMap)); j++) {
            let key = _.keys(allAttribsDataItemMap)[j];
            if (_.map(allAttribsDataItemMap[key].displayDataItems, 'name').indexOf(namedItem) != -1) {
                return key;
            }
        }
    };
    return DisplayFilterService;
}());
exports.DisplayFilterService = DisplayFilterService;