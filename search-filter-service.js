"use strict";
var _ = require('lodash');
var SearchFilterService = (function () {
    function SearchFilterService() {}
    SearchFilterService.prototype.getSearchResults = function (data, searchList, searchLogicalCondition) {
        let matched = false,
            i;
        let results = [];
        if (data && data.length > 0) {
            for (i = 0; i < data.length; i++) {
                matched = this.isSearchCriteriaMatched(data[i], searchList, searchLogicalCondition);
                if (matched) {
                    results.push(data[i]);
                }
            }
        }
        return results;
    }
    SearchFilterService.prototype.isSearchCriteriaMatched = function (record, searchList, searchLogicalCondition) {
        let matched = false;
        for (let i = 0; i < searchList.length; i++) {
            let searchFieldCriteria = searchList[i];
            matched = this.isFieldCriteriaMatched(this.getFieldValue(record, searchFieldCriteria.field), searchFieldCriteria.conditions, searchFieldCriteria.dataType, searchFieldCriteria.searchLogicalCondition, searchFieldCriteria.caseSensitive, searchFieldCriteria.isHide);
            if ((!matched && searchLogicalCondition === SearchLogicalCondition.And) || (matched && searchLogicalCondition === SearchLogicalCondition.Or)) {
                break;
            }
        }
        return matched;
    }
    SearchFilterService.prototype.isFieldCriteriaMatched = function (fieldValue, searchConditionList, dataType, searchLogicalCondition, caseSensitive, isHide) {
        let matched = false,
            searchConditionValue;

        for (let i = 0; i < searchConditionList.length; i++) {
            let searchCondition = searchConditionList[i];

            matched = false, searchConditionValue = searchCondition.value;
            if (fieldValue == null) {
                matched = searchConditionValue == null;
            } else if (dataType === FieldDataType.Boolean) {
                matched = (searchCondition.key === SearchConditionType.Equals ? searchConditionValue === fieldValue : searchConditionValue !== fieldValue); // else if (dataType === FieldDataType.Number || fieldValue instanceof Date) {
            } else if (dataType === FieldDataType.Number || dataType === FieldDataType.Date) {
                if (searchConditionValue != null) {
                    switch (searchCondition.key) {
                        case SearchConditionType.RangeStartsFrom:
                        case SearchConditionType.GreaterThanEquals:
                            matched = fieldValue >= searchConditionValue;
                            break;

                        case SearchConditionType.RangeEndsTo:
                        case SearchConditionType.LessThanEquals:
                            matched = fieldValue <= searchConditionValue;
                            break;

                        case SearchConditionType.Equals:
                            matched = fieldValue === searchConditionValue;
                            break;

                        case SearchConditionType.NotEquals:
                            matched = fieldValue !== searchConditionValue;
                            break;

                        case SearchConditionType.GreaterThan:
                            matched = fieldValue > searchConditionValue;
                            break;

                        case SearchConditionType.LessThan:
                            matched = fieldValue < searchConditionValue;
                            break;

                    }

                }
            } else if (dataType === FieldDataType.String || dataType.toLowerCase() === FieldDataType.DateTime.toLowerCase()) {
                fieldValue = fieldValue.toString();
                if (!caseSensitive) {
                    if (searchConditionValue) {
                        searchConditionValue = searchConditionValue.toLowerCase();
                    }
                    fieldValue = fieldValue.toLowerCase();
                }

                switch (searchCondition.key) {
                    case SearchConditionType.Contains:
                        matched = fieldValue.indexOf(searchConditionValue) !== -1;
                        break;

                    case SearchConditionType.NotContains:
                        matched = fieldValue.indexOf(searchConditionValue) === -1;
                        break;

                    case SearchConditionType.Equals:
                        matched = fieldValue === searchConditionValue;
                        break;

                    case SearchConditionType.NotEquals:
                        matched = fieldValue !== searchConditionValue;
                        break;

                    case SearchConditionType.MatchWholeWord:
                        let words = fieldValue.split(' ');
                        matched = words.indexOf(searchConditionValue) !== -1;
                        break;

                    case SearchConditionType.StartsWith:
                        matched = fieldValue.indexOf(searchConditionValue) === 0;
                        break;

                    case SearchConditionType.EndsWith:
                        matched = fieldValue.indexOf(searchConditionValue) === fieldValue.length - searchConditionValue.length;
                        break;

                }
            }
            if ((!matched && searchLogicalCondition === SearchLogicalCondition.And) || (matched && searchLogicalCondition === SearchLogicalCondition.Or)) {
                break;
            }
        }

        return isHide ? !matched : matched;
    }
    SearchFilterService.prototype.getFieldValue = function (data, property) {
        let fieldValue = null;
        if (!data) {
            fieldValue = null;
        } else if (typeof data === 'object') {
            fieldValue = data[property];
        }
        return fieldValue;
    }

    return SearchFilterService;
}());
exports.SearchFilterService = SearchFilterService;
var FieldDataType;
(function (FieldDataType) {
    FieldDataType["String"] = "string";
    FieldDataType["Number"] = "number";
    FieldDataType["Date"] = "date";
    FieldDataType["Boolean"] = "boolean";
    FieldDataType["DateTime"] = "DateTime";
})(FieldDataType = exports.FieldDataType || (exports.FieldDataType = {}));
var SearchLogicalCondition;
(function (SearchLogicalCondition) {
    SearchLogicalCondition["And"] = "and";
    SearchLogicalCondition["Or"] = "or";
})(SearchLogicalCondition = exports.SearchLogicalCondition || (exports.SearchLogicalCondition = {}));
var SearchConditionType;
(function (SearchConditionType) {
    SearchConditionType["Contains"] = "contains";
    SearchConditionType["Equals"] = "equals";
    SearchConditionType["LessThan"] = "lessThan";
    SearchConditionType["GreaterThan"] = "greaterThan";
    SearchConditionType["LessThanEquals"] = "lessThanEquals";
    SearchConditionType["GreaterThanEquals"] = "greaterThanEquals";
    SearchConditionType["StartsWith"] = "startsWith";
    SearchConditionType["EndsWith"] = "endsWith";
    SearchConditionType["MatchWholeWord"] = "matchWholeWord";
    SearchConditionType["NotEquals"] = "notEquals";
    SearchConditionType["RangeStartsFrom"] = "rangeStartsFrom";
    SearchConditionType["RangeEndsTo"] = "rangeEndsTo";
    SearchConditionType["NotContains"] = "notContains";
})(SearchConditionType = exports.SearchConditionType || (exports.SearchConditionType = {}));