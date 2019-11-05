"use strict";
exports.__esModule = true;
var _ = require("lodash");
var ReportTranformDataService = /** @class */ (function () {
  function ReportTranformDataService() {}
  ReportTranformDataService.prototype.transform = function (serviceReposnse, columnParentsInfo, outputFormat, allAttribsDataItemMap, isValueConcatRequired, displayFilters) {
    var filteredData = serviceReposnse['data'];
    var rowAttributeNames = this.getGroupedAttrs('rows', outputFormat);
    var gridAttributeNames = _.concat(outputFormat.gridColumns, outputFormat.gridRows);
    var colAttributeNames = this.getGroupedAttrs('columns', outputFormat);
    var rowColumns = [];
    rowAttributeNames.forEach(function (attr) {
      var attrColumns = allAttribsDataItemMap[attr].idDataItems.map(function (x) {
        return x.name;
      });
      rowColumns = rowColumns.concat(attrColumns);
    });
    var pivotResponse = this.transformData(filteredData, _.map(_.values(columnParentsInfo), function (x) {
      return x.toString();
    }), rowColumns, colAttributeNames, serviceReposnse, allAttribsDataItemMap, displayFilters);
    pivotResponse.data = this.mergeMultipleDataSets(serviceReposnse, pivotResponse.data, rowAttributeNames, gridAttributeNames, allAttribsDataItemMap, isValueConcatRequired);
    return pivotResponse;
  };
  ReportTranformDataService.prototype.filterDataBasedOnDrillVals = function (data, filters) {
    _.map(filters, function (value, key) {
      data = data.filter(function (record) {
        return value === record[key];
      });
    });
    return data;
  };
  ReportTranformDataService.prototype.transformData = function (rawData, parents, rowColumns, colAttributeNames, serverResponse, allAttribsDataItemMap, displayFilters) {
    var self = this;
    var values = [];
    var uniqueRowsObject = {};
    var colAttrColumns = [];
    colAttributeNames.forEach(function (attr) {
      var attrColumns = allAttribsDataItemMap[attr].idDataItems.map(function (x) {
        return x.name;
      });
      colAttrColumns = colAttrColumns.concat(attrColumns);
    });
    for (let index = 0; index < rawData.length; index++) {
      let x = rawData[index];
      var uniqueRow = self.getRowData(x, rowColumns, '_');
      if (!uniqueRowsObject[uniqueRow]) {
        uniqueRowsObject[uniqueRow] = {};
      }
      var rowObject = uniqueRowsObject[uniqueRow];
      for (let i = 0; i < rowColumns.length; i++) {
        rowObject[rowColumns[i]] = x[rowColumns[i]];
      }

      if (colAttrColumns.length > 0) {
        rowObject[(parents.length > 0 ? parents.join('_') + '_' : '') + self.getRowData(x, colAttrColumns)] = x['value'];
      } else {
        rowObject['value'] = x['value'];
      }
    }
    var uniqueCols;
    uniqueCols = this.findUniqueCols(colAttributeNames, serverResponse, rawData, allAttribsDataItemMap, displayFilters);
    var res = _.values(uniqueRowsObject);
    return {
      data: res,
      cols: uniqueCols
    };
  };
  ReportTranformDataService.prototype.getRowData = function (obj, rows, symbol) {
    let _this = this;
    var str = '';
    str = _this.getConcatenatedValues(obj, rows, '_');
    if (symbol) {
      str += symbol;
    }
    return str;
  };
  ReportTranformDataService.prototype.findUniqueRows = function (rowAttributes, rawData, symbol) {
    var self = this;
    var uniqueRowsArray = _.uniq(_.map(rawData, function (x) {
      return symbol ? self.getRowData(x, rowAttributes, symbol) : self.getRowData(x, rowAttributes);
    }));
    var uniqueRowsObject = {};
    _.map(uniqueRowsArray, function (x) {
      uniqueRowsObject[x] = {};
    });
    return uniqueRowsObject;
  };
  ReportTranformDataService.prototype.findUniqueCols = function (colAttributes, serverData, rawData, allAttribsDataItemMap, displayFilters) {
    var uniqueColsArray = [];
    var self = this;
    colAttributes.forEach(function (attr) {
      var crntAttribDisplayFilters = displayFilters[attr];
      var filteredValues;
      if (crntAttribDisplayFilters) {
        filteredValues = _.map(crntAttribDisplayFilters, function (x) {
          return _.join(_.values(x), '_');
        });
      }
      var colAttrColumns = allAttribsDataItemMap[attr].idDataItems.map(function (x) {
        return x.name;
      });
      var uniqueCols = [];
      var uniqueVals = _.uniq(_.map(rawData, function (x) {
        return self.getRowData(x, colAttrColumns);
      }));
      uniqueVals = filteredValues ? _.intersection(filteredValues, uniqueVals) : uniqueVals;
      uniqueVals.forEach(function (val) {
        var uniqRec = _.find(serverData[attr], function (x) {
          return self.getRowData(x, colAttrColumns) === val;
        });
        if (uniqRec) {
          uniqueCols.push(uniqRec);
        }
      });
      uniqueColsArray.push(uniqueCols);
    });
    return uniqueColsArray;
  };
  ReportTranformDataService.prototype.mergeMultipleDataSets = function (serverData, rawData, attrs, gridAttrs, allAttribsDataItemMap, isRowConcatRequired) {
    var uniqueObj = this.generateUniqueValsForAttributes(serverData, attrs, allAttribsDataItemMap);
    var self = this;
    var rowidCols = [];
    var rowNameCols = [];
    var multiDataItemIdCols = [];
    var multiDataItemNameCols = [];
    for (let attrIndex = 0; attrIndex < attrs.length; attrIndex++) {
      let attr = attrs[attrIndex];
      if (gridAttrs.indexOf(attr) !== -1) {
        continue;
      }
      var rowAttrDataItems = allAttribsDataItemMap[attr];
      rowidCols = rowidCols.concat(rowAttrDataItems.idDataItems.map(function (x) {
        return x.name;
      }));
      rowNameCols = rowNameCols.concat(rowAttrDataItems.displayDataItems.map(function (x) {
        return x.name;
      }));
      if (rowAttrDataItems.idDataItems.length > 1) {
        multiDataItemIdCols.push(rowAttrDataItems.displayDataItems.map(function (x) {
          return x.name;
        }));
      }
      if (rowAttrDataItems.displayDataItems.length > 1) {
        multiDataItemNameCols.push(rowAttrDataItems.displayDataItems.map(function (x) {
          return x.name;
        }));
      }
    };
    isRowConcatRequired = isRowConcatRequired && (rowidCols.length > 1 || rowNameCols.length > 1);
    for (let index = 0; index < rawData.length; index++) {
      let record = rawData[index];
      for (let attrIndex = 0; attrIndex < attrs.length; attrIndex++) {
        let attr = attrs[attrIndex];
        var rowAttrDataItems = allAttribsDataItemMap[attr];
        _.assign(record, uniqueObj[attr][self.getRowData(record, rowAttrDataItems.idDataItems.map(function (x) {
          return x.name;
        }))]);
      }
      if (isRowConcatRequired) {
        record[rowidCols.join('_')] = self.getConcatenatedValues(record, rowidCols);
        record[rowNameCols.join('_')] = self.getConcatenatedValues(record, rowNameCols);
        for (let idColIndex = 0; idColIndex < multiDataItemIdCols.length; idColIndex++) {
          let multiDataItemIdCol = multiDataItemIdCols[idColIndex];
          record[multiDataItemIdCol.join('_')] = self.getConcatenatedValues(record, multiDataItemIdCol);
        }
        for (let nameColIndex = 0; nameColIndex < multiDataItemNameCols.length; nameColIndex++) {
          let multiDataItemNameCol = multiDataItemNameCols[nameColIndex];
          record[multiDataItemNameCol.join('_')] = self.getConcatenatedValues(record, multiDataItemNameCol);
        }
      }
    }
    return rawData;
  };

  ReportTranformDataService.prototype.getConcatenatedValues = function (record, props, symbol) {
    let values = [];
    for (let propIndex = 0; propIndex < props.length; propIndex++) {
      let prop = props[propIndex];
      if (_.has(record, prop)) {
        values.push(record[prop]);
      }
    }
    symbol = symbol || '_';
    return _.join(values, symbol)
  };

  ReportTranformDataService.prototype.generateUniqueValsForAttributes = function (serverData, attributes, allAttribsDataItemMap) {
    var _this = this;
    var result = {};
    attributes.forEach(function (attr) {
      var attrData = serverData[attr];
      var rowAttrColumns = allAttribsDataItemMap[attr].idDataItems.map(function (x) {
        return x.name;
      });
      result[attr] = _this.createUniqueObj(attrData, rowAttrColumns);
    });
    return result;
  };

  ReportTranformDataService.prototype.createUniqueObj = function (data, props, symbol, valuePath) {
    var self = this;
    var uniqueRowsObject = {};
    for (let index = 0; index < data.length; index++) {
      let x = valuePath ? _.get(data[index], valuePath) : data[index];
      uniqueRowsObject[self.getRowData(x, props, symbol)] = data[index];
    }
    return uniqueRowsObject;
  };

  ReportTranformDataService.prototype.createUniqueObjWithProps = function (data, props, propsInObj, symbol) {
    var self = this;
    var uniqueRowsObject = {};
    for (let index = 0; index < data.length; index++) {
      let x = data[index];
      uniqueRowsObject[self.getRowData(x, props, symbol)] = _.pick(x, propsInObj);
    }
    return uniqueRowsObject;
  };

  ReportTranformDataService.prototype.getGroupedAttrs = function (entity, format) {
    var groupedKeys = format[entity];
    groupedKeys = groupedKeys.filter(function (x) {
      return format['groupedAttrs'].indexOf(x) !== -1;
    });
    return _.intersection(format[entity], groupedKeys);
  };
  return ReportTranformDataService;
}());
exports.ReportTranformDataService = ReportTranformDataService;
