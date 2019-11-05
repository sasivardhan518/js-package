"use strict";
let _ = require('lodash');
var Defaults = require('./defaults').defaults;
let transformServiceInstance = require("./report-data-transform-service");
let CommonUtilsService = (function () {
    function CommonUtilsService() {
        this.transformService = new transformServiceInstance.ReportTranformDataService();
        this.colors = Defaults.colors;
    }
    CommonUtilsService.prototype.getIntersectedValues = function (sourceData, targetData, props, pickPropsOnly, sourceDataValuePath, targetDataValuePath) {
        let result = [];
        let values = [];
        let uniqueValuesObject = this.transformService.createUniqueObj(sourceData, props, '_', sourceDataValuePath);
        for (let i = 0; i < targetData.length; i++) {
            for (let j = 0; j < props.length; j++) {
                values.push(targetDataValuePath ? _.get(targetData[i], targetDataValuePath)[props[j]] : targetData[i][props[j]]);
            }
            if (uniqueValuesObject[values.join('_') + '_']) {
                let value = uniqueValuesObject[values.join('_') + '_'];
                result.push(pickPropsOnly ? _.pick(value, props) : value);
                delete uniqueValuesObject[values.join('_') + '_'];
            }
            values = [];
        }
        return result;
    };

    CommonUtilsService.prototype.mapOrder = function (array, orderedArray, keys) {
        let valuesInOrderedArray = array,
            valuesNotInOrderedArray = [];
        if (array.length != orderedArray.length) {
            valuesInOrderedArray = _.intersectionWith(array, orderedArray, function (a, b) {
                return _.isEqual(_.pick(a, keys), _.pick(b, keys));
            });
            valuesNotInOrderedArray = _.differenceWith(array, orderedArray, function (a, b) {
                return _.isEqual(_.pick(a, keys), _.pick(b, keys));
            });
        }
        valuesInOrderedArray.sort(function (a, b) {
            if (_.indexOf(orderedArray, _.pick(a, keys)) > _.indexOf(orderedArray, _.pick(b, keys))) {
                return 1;
            } else {
                return -1;
            }
        });
        valuesInOrderedArray = valuesInOrderedArray.concat(valuesNotInOrderedArray);
        return valuesInOrderedArray;
    };

    CommonUtilsService.prototype.getConcatenatedValues = function (record, props, symbol) {
        let values = [];
        _.forEach(props, function (prop) {
            if (_.has(record, prop)) {
                values.push(record[prop]);
            }
        });
        symbol = symbol || '_';
        return _.join(values, symbol);
    };

    CommonUtilsService.prototype.orderArray = function (array, order, key, symbol) {
        array.sort(function (a, b) {
            var A = a[key] + symbol,
                B = b[key] + symbol;
            if (order.indexOf(A) > order.indexOf(B)) {
                return 1;
            } else {
                return -1;
            }
        });
        return array;
    };

    CommonUtilsService.prototype.deepSort = function (inputObject) {
        var _this = this;
        var objectToSort = _.cloneDeep(inputObject);
        _.forOwn(objectToSort, function (value, key) {
            if (value && Array.isArray(value)) {
                var isObjectArray = _.isObject(value[0]);
                if (isObjectArray) {
                    var keysOfObjectInArray = _.orderBy(_.keys(value[0]));
                    objectToSort[key] = _.orderBy(value, keysOfObjectInArray);
                } else {
                    objectToSort[key] = _.orderBy(value);
                }
                _.forEach(value, function (val) {
                    if (typeof val === "object") {
                        _this.deepSort(val);
                    }
                });
            } else if (value && typeof value === "object")
                _this.deepSort(value);
        });
        return objectToSort;
    };

    CommonUtilsService.prototype.getBinaryValue = function (number) {
        var reminders = [];
        while (number > 1) {
            reminders.unshift(number % 2);
            number = Math.floor(number / 2);
        }
        reminders.unshift(number);
        return reminders;
    };

    CommonUtilsService.prototype.deepCloneObjects = function (from, to) {
        if (from == null || typeof from != "object") return from;
        if (from.constructor != Object && from.constructor != Array) return from;
        if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
            from.constructor == String || from.constructor == Number || from.constructor == Boolean)
            return new from.constructor(from);

        to = to || new from.constructor();

        for (var name in from) {
            to[name] = typeof to[name] == "undefined" ? this.deepCloneObjects(from[name], null) : to[name];
        }

        return to;
    };

    CommonUtilsService.prototype.cartesianProdOfArrOfObjs = function (arr) {
        if (_.size(arr) === 0) {
            return [];
        }
        let result = arr.reduce(function (a, b) {
            return a.map(function (x) {
                return b.map(function (y) {
                    return x.concat(y);
                })
            }).reduce(function (a, b) {
                return a.concat(b)
            }, [])
        }, [
            []
        ]).reduce(function (arrayObj, array) {
            arrayObj.push(array.reduce(function (obj, item) {
                Object.assign(obj, item);
                return obj;
            }, {}));
            return arrayObj;
        }, []);

        return result;
    };

    CommonUtilsService.prototype.cartesianProductOf = function () {
        return _.reduce(arguments[0], function (a, b) {
            return _.flatten(_.map(a, function (x) {
                return _.map(b, function (y) {
                    return x.concat([y]);
                });
            }), true);
        }, [
            []
        ]);
    };

    CommonUtilsService.prototype.getSequenceArray = function (arraySize, startValue, returnValue) {
        if (returnValue) {
            return Array.apply(null, new Array(arraySize)).map(function (element, i) {
                return returnValue
            });
        } else {
            return Array.apply(null, new Array(arraySize)).map(function (element, i) {
                return i + startValue
            });
        }
    };


    CommonUtilsService.prototype.getGradientColor = function (startColor, endColor, partitionCount, slotNumber) {
        let ratio = slotNumber / partitionCount;
        startColor = startColor.split('#').pop();
        endColor = endColor.split('#').pop();
        let r = Math.floor(parseInt(startColor.substring(0, 2), 16) * (1 - ratio) + parseInt(endColor.substring(0, 2), 16) * ratio);
        let g = Math.floor(parseInt(startColor.substring(2, 4), 16) * (1 - ratio) + parseInt(endColor.substring(2, 4), 16) * ratio);
        let b = Math.floor(parseInt(startColor.substring(4, 6), 16) * (1 - ratio) + parseInt(endColor.substring(4, 6), 16) * ratio);
        let gradientColor = '#' + this.getHexaDecimalValue(r) + this.getHexaDecimalValue(g) + this.getHexaDecimalValue(b);
        return gradientColor;
    };

    CommonUtilsService.prototype.getHexaDecimalValue = function (decimal) {
        let hexaDecimal = decimal.toString(16);
        return (hexaDecimal.length === 1) ? '0' + hexaDecimal : hexaDecimal;
    };

    CommonUtilsService.prototype.getColor = function (index) {
        if (index >= this.colors.length) {
            index = index % this.colors.length;
        }
        return this.colors[index];
    };

    CommonUtilsService.prototype.getLighterColorCode = function (color, percent) {
        color = color || '#000000';
        var num = parseInt(color.slice(1), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        var lowColorCode = '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        if (lowColorCode !== '#ffffff') {
            this.getLighterColorCode(lowColorCode, 40);
        }
        return lowColorCode;
    };

    CommonUtilsService.prototype.isValidValue = function (value) {
        return !_.isNull(value) && !_.isUndefined(value);
    };

    CommonUtilsService.prototype.getKeyFromValue = function (obj, value) {
        obj = obj || {};
        return _.keys(obj)[_.values(obj).indexOf(value)];
    };

    return CommonUtilsService;
}());
exports.CommonUtilsService = CommonUtilsService;