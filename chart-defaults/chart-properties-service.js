"use strict";
exports.__esModule = true;
var moment = require('moment');
var _ = require('lodash');
var chart_properties_defaults = require('./chart-properties-defaults');
var common_utils_service = require('../common-utils-service');
var report_column_service = require('../report-column-service');
var ChartTypesEnum = require('./chart-types-enum').ChartTypesEnum;
var MarkerTypesEnum = require('./marker-types-enum').MarkerTypesEnum;
var ReportFormatDimensionsEnum = require('./report-format-dimensions-enum').ReportFormatDimensionsEnum;
var ReportFormatHierarchyType = require('./report-format-hierarchy-type-enum').ReportFormatHierarchyType;
var ColorType = require('./color-types-enum').ColorTypes;
var Defaults = require('../defaults').defaults;
var ChartPropertiesService = (function () {

  function ChartPropertiesService() {
    this.commonUtilsService = new common_utils_service.CommonUtilsService();
    this.reportColumnService = new report_column_service.ColumnService();
    this.chartPropertiesDefaults = new chart_properties_defaults.ChartPropertiesDefaults();
    this.XYCharts = [ChartTypesEnum.BubbleChart, ChartTypesEnum.ScatterChart];
    this.singleColorCharts = [ChartTypesEnum.BarChart, ChartTypesEnum.ColumnChart, ChartTypesEnum.Map];
    this.mapPropertiesSelectionCount = 2;
    this.setChartPropertiesMetaData();
  };

  ChartPropertiesService.prototype.setChartPropertiesMetaData = function (currentVisual, metaData, rowValues, colValues, mapParametrers) {
    this.currentVisual = currentVisual;
    this.metaData = metaData;
    this.rowValues = rowValues;
    this.colValues = colValues;
    this.mapParametrers = mapParametrers;
  };

  ChartPropertiesService.prototype.updateChartProperties = function (currentVisual, currentChartPropsObj, rowValues, colValues, metaData, data, dsFunctions, gridValues, measureValue) {
    this.getDefaultsForChartType(currentVisual, currentChartPropsObj, rowValues, colValues, metaData);
    if (currentChartPropsObj.colorType === ColorType.DSFColor) {
      this.applyDSFForChartProperties(currentVisual, currentChartPropsObj, rowValues, colValues, metaData, dsFunctions, _.join(_.values(gridValues), '_'), measureValue);
    }
    if (currentChartPropsObj.colorType !== ColorType.DSFColor) {
      this.updateColorForNestedData(currentVisual, currentChartPropsObj, rowValues, colValues, metaData, data, dsFunctions, gridValues, measureValue);
    }
  };

  ChartPropertiesService.prototype.getDefaultsForChartType = function (currentVisual, currentChartPropsObj, rowValues, colValues, metaData, mapParametrers) {
    console.time('defaultsSet');
    this.setChartPropertiesMetaData(currentVisual, metaData, rowValues, colValues, mapParametrers);
    this.updateAttributeName(currentChartPropsObj);
    var chartType = this.currentVisual.chartType;
    switch (chartType) {
      case ChartTypesEnum.BarChart:
      case ChartTypesEnum.ColumnChart:
      case ChartTypesEnum.PieChart:
      case ChartTypesEnum.FunnelChart:
      case ChartTypesEnum.TreeChart:
      case ChartTypesEnum.YearOnYearChart:
        this.updateColumnValue(currentChartPropsObj);
        this.updateSerialChartsCommonProps(currentChartPropsObj);
        break;
      case ChartTypesEnum.StackColumnChart:
      case ChartTypesEnum.StackBarChart:
      case ChartTypesEnum.ClusteredBarChart:
      case ChartTypesEnum.ClusteredColumnChart:
        this.updateSerialChartsCommonProps(currentChartPropsObj);
        break;
      case ChartTypesEnum.ComboChart:
      case ChartTypesEnum.LineChart:
      case ChartTypesEnum.AreaChart:
      case ChartTypesEnum.StackLineChart:
      case ChartTypesEnum.StackAreaChart:
        this.updateSerialChartsCommonProps(currentChartPropsObj);
        break;
      case ChartTypesEnum.BubbleChart:
      case ChartTypesEnum.ScatterChart:
        this.updateXYProps(currentChartPropsObj);
        this.updateSerialChartsCommonProps(currentChartPropsObj);
        break;
      case ChartTypesEnum.GaugeChart:
      case ChartTypesEnum.HorizontalBridgeChart:
      case ChartTypesEnum.VerticalBridgeChart:
      case ChartTypesEnum.HorizontalTargetChart:
      case ChartTypesEnum.VerticalTargetChart:
        this.updateSourceTargetChartProps(currentChartPropsObj);
        break;

      case ChartTypesEnum.TileChart:
        this.updateTileChartProps(currentChartPropsObj);
        break;
      case ChartTypesEnum.Map:
        if (!this.mapParametrers) {
          return;
        }
        this.updateMapProps(currentChartPropsObj);
        break;
    }
    console.timeEnd('defaultsSet');
    return currentChartPropsObj;
  };

  ChartPropertiesService.prototype.getDifferenceForChartType = function (currentVisual, currentChartPropsObj, rowValues, colValues, metaData) {
    console.time('difference');
    let _this = this;
    this.setChartPropertiesMetaData(currentVisual, metaData, rowValues, colValues);
    this.updateAttributeName(currentChartPropsObj);
    var diffObj = {};
    var chartType = this.currentVisual.chartType;
    var defaultObj = this.chartPropertiesDefaults.getDefaultsBasedOnChartType(this.currentVisual.chartType);
    switch (chartType) {
      case ChartTypesEnum.BarChart:
      case ChartTypesEnum.ColumnChart:

      case ChartTypesEnum.FunnelChart:
      case ChartTypesEnum.PieChart:
      case ChartTypesEnum.TreeChart:
        var isCustomColor = currentChartPropsObj.colorType === 'Custom';
        var arrayPropsToIgnore = [];
        if (!isCustomColor || currentChartPropsObj.isAutoColor) {
          // arrayPropsToIgnore.push('value');
          arrayPropsToIgnore.push('color');
        }
        this.getDifference(currentChartPropsObj, defaultObj, diffObj, [], ['value'], arrayPropsToIgnore);
        if (!_.has(diffObj, 'isAutoColor')) {
          delete diffObj.colorType;
        }
        break;
      case ChartTypesEnum.ComboChart:
      case ChartTypesEnum.LineChart:
      case ChartTypesEnum.AreaChart:
      case ChartTypesEnum.StackLineChart:
      case ChartTypesEnum.StackAreaChart:
      case ChartTypesEnum.YearOnYearChart:
      case ChartTypesEnum.StackColumnChart:
      case ChartTypesEnum.StackBarChart:
      case ChartTypesEnum.ClusteredBarChart:
      case ChartTypesEnum.ClusteredColumnChart:
        var isCustomColor = currentChartPropsObj.colorType === 'Custom';
        var arrayPropsToIgnore = [];
        var propsToCheck = ['value'];
        if (!isCustomColor || currentChartPropsObj.isAutoColor) {
          arrayPropsToIgnore.push('color');
        }
        var mandatoryPropsObj = null;
        this.updateSelectedValues(currentChartPropsObj, defaultObj);
        this.getDifference(currentChartPropsObj, defaultObj, diffObj, [], propsToCheck, arrayPropsToIgnore, mandatoryPropsObj);
        if (!_.has(diffObj, 'isAutoColor')) {
          delete diffObj.colorType;
        }
        break;
      case ChartTypesEnum.ScatterChart:
      case ChartTypesEnum.BubbleChart:
        var currentchartPropsCopy = _.cloneDeep(currentChartPropsObj);
        var isCustomColor = currentChartPropsObj.colorType === 'Custom';
        var arrayPropsToIgnore = [];
        var propsToIgnore = [];
        if ((!isCustomColor || currentChartPropsObj.isAutoColor) && currentChartPropsObj.attributeName) {
          arrayPropsToIgnore.push('color');
        }
        if (!currentChartPropsObj.attributeName) {
          currentchartPropsCopy.attribValueProperties = _.size(currentchartPropsCopy.attribValueProperties) ? [currentchartPropsCopy.attribValueProperties[0]] : [];
        } else {
          var dataItems = _this.getDataItems(currentChartPropsObj.attributeName);
          if (dataItems) {
            var idItems = _.map(_this.getDataItems(currentChartPropsObj.attributeName).idDataItems, function (x) {
              return x.name;
            });
            currentchartPropsCopy.attribValueProperties = _.uniqBy(currentchartPropsCopy.attribValueProperties, function (prop) {
              prop.value = _.pick(prop.value, idItems);
              return _.join(_.values(_.pick(prop.value, idItems)));
            });
          }
        }
        this.getDifference(currentchartPropsCopy, defaultObj, diffObj, propsToIgnore, ['value'], arrayPropsToIgnore);
        if (!_.has(diffObj, 'isAutoColor')) {
          delete diffObj.colorType;
        }
        if (!currentChartPropsObj.attributeName) {
          if (_.has(diffObj, ['attribValueProperties'])) {
            diffObj['attribValueProperties'][0].value = {};
          }
        }
        break;
      case ChartTypesEnum.GaugeChart:
      case ChartTypesEnum.HorizontalBridgeChart:
      case ChartTypesEnum.VerticalBridgeChart:
      case ChartTypesEnum.HorizontalTargetChart:
      case ChartTypesEnum.VerticalTargetChart:
        this.getDifference(currentChartPropsObj, defaultObj, diffObj, [], [], []);
        break;
      case ChartTypesEnum.TileChart:
        var propsToCheck = [];
        var mandatoryPropsObj = null;
        currentChartPropsObj.valuesToDisplay = _.map(currentChartPropsObj.columnValues, function (colVal) {
          return colVal.value;
        });
        this.updateSelectedValues(currentChartPropsObj, defaultObj);
        this.getDifference(currentChartPropsObj, defaultObj, diffObj, [], propsToCheck, arrayPropsToIgnore, mandatoryPropsObj);
        break;
      case ChartTypesEnum.Map:
        var currentChartPropsObjCopy = _.cloneDeep(currentChartPropsObj);
        if (_.has(currentChartPropsObjCopy, ['markerProperties'])) {
          currentChartPropsObjCopy.markerProperties = _.filter(currentChartPropsObjCopy.markerProperties, function (markerProperty) {
            return !markerProperty.isDisabled;
          });
        }
        if (_.size(currentChartPropsObjCopy.colorAttributes) === 0) {
          currentChartPropsObjCopy.rowValues = defaultObj.rowValues;
        }
        this.getDifference(currentChartPropsObjCopy, defaultObj, diffObj, [], [], [], null);
        if (!_.has(diffObj, 'isAutoColor')) {
            delete diffObj.color;
            delete diffObj.colorType;
        }
        break;
    }
    console.timeEnd('difference');
    return diffObj;
  };

  ChartPropertiesService.prototype.updateSelectedValues = function (currentChartPropsObj, defaultObj, dimension) {
    var formatKey = this.getFormatKey(dimension);
    var propName = this.getValuePropertyName();
    if (!_.has(defaultObj[propName][0], 'isDisabled')) {
      return;
    }
    if (currentChartPropsObj.isAllSelected || currentChartPropsObj.formatKey !== formatKey) {
      defaultObj[propName][0].isDisabled = false;
    } else {
      defaultObj[propName][0].isDisabled = true;
    }
    if (_.has(currentChartPropsObj, propName)) {
      currentChartPropsObj[propName] = _.filter(currentChartPropsObj[propName], function (prop) {
        return !prop.isDisabled;
      });
    }
  };

  ChartPropertiesService.prototype.getFormatKey = function (dimension) {
    let _this = this;
    dimension = dimension || ReportFormatDimensionsEnum.Columns;
    var formatKey = _.join(_this.metaData.outputFormat[dimension], '_');
    return formatKey;
  }

  ChartPropertiesService.prototype.updateAutoColorType = function (currentChartPropsObj) {
    let colorTypes = this.getColorTypes(currentChartPropsObj);
    if (!_.includes(colorTypes, currentChartPropsObj.colorType) || !currentChartPropsObj.colorType || currentChartPropsObj.isAutoColor) {
      currentChartPropsObj.colorType = this.getDefaultColorType(currentChartPropsObj);
      currentChartPropsObj.isAutoColor = true;
    }
  }

  ChartPropertiesService.prototype.updateSerialChartsCommonProps = function (currentChartPropsObj) {
    let props;
    this.updateAutoColorType(currentChartPropsObj);
    if (_.indexOf(this.XYCharts, this.currentVisual.chartType) !== -1 && currentChartPropsObj['attributeName']) {
      props = [];
      if (_.indexOf(this.metaData.outputFormat.rows, currentChartPropsObj['attributeName']) === -1) {
        currentChartPropsObj['attributeName'] = null;
        currentChartPropsObj['attribValueProperties'] = [];
      } else {
        var dataItems = this.getDataItems(currentChartPropsObj['attributeName']);
        if (dataItems) {
          var idItemNames = _.map(dataItems.idDataItems, function (x) {
            return x.name;
          });
          var displayItemNames = _.map(dataItems.displayDataItems, function (x) {
            return x.name;
          });
          var sortItemNames = _.map(dataItems.sortDataItems, function (x) {
            return x.name;
          });
          var colorItemNames = _.map(dataItems.colorDataItems, function (x) {
            return x.name;
          });
          Array.prototype.push.apply(props, _.flattenDeep([idItemNames, displayItemNames, sortItemNames, colorItemNames]));
        }
      }
    }
    let prevChartProps = _.cloneDeep(currentChartPropsObj);
    this.updateChartProps(currentChartPropsObj, props);
    this.mergeWithDefaults(currentChartPropsObj, prevChartProps);
  };

  ChartPropertiesService.prototype.mergeWithDefaults = function (currentChartPropsObj, prevChartProps) {
    var defaultObj = _.cloneDeep(this.chartPropertiesDefaults.getDefaultsBasedOnChartType(this.currentVisual.chartType, currentChartPropsObj));
    var propName = this.getValuePropertyName();
    if (_.has(currentChartPropsObj, 'isAllSelected') && this.isColumnSelectionCharts()) {
      defaultObj[propName][0].isDisabled = !currentChartPropsObj.isAllSelected;
    }
    if (this.isColumnSelectionCharts() && currentChartPropsObj.formatKey !== this.getFormatKey()) {
      defaultObj[propName][0].isDisabled = false;
      currentChartPropsObj.formatKey = this.getFormatKey()
    }
    this.updateDefaults(defaultObj, prevChartProps);
    this.getDefaultsForCurrentObj(currentChartPropsObj, defaultObj);
  };

  ChartPropertiesService.prototype.updateDefaults = function (defaultObj, currentChartPropsObj) {
    let chartType = this.currentVisual.chartType;
    switch (chartType) {
      case ChartTypesEnum.BubbleChart:
      case ChartTypesEnum.ScatterChart:
        if (!currentChartPropsObj.attributeName) {
          defaultObj.attribValueProperties[0].shape = currentChartPropsObj && _.size(currentChartPropsObj.attribValueProperties) && currentChartPropsObj.attribValueProperties[0].shape ? currentChartPropsObj.attribValueProperties[0].shape : defaultObj.attribValueProperties[0].shape;
          defaultObj.attribValueProperties[0].size = currentChartPropsObj && _.size(currentChartPropsObj.attribValueProperties) && currentChartPropsObj.attribValueProperties[0].size ? currentChartPropsObj.attribValueProperties[0].size : defaultObj.attribValueProperties[0].size;
        }
        break;
    }
  }

  ChartPropertiesService.prototype.updateColumnValue = function (currentChartPropsObj) {
    var colIdDataItemNames = this.getDataItemNames('columns');
    if (!currentChartPropsObj['value']) {
      currentChartPropsObj['value'] = _.size(colIdDataItemNames) ? _.pick(this.colValues[0], colIdDataItemNames) : _.pick(this.colValues[0], 'value');
    } else {
      this.updateColValues(currentChartPropsObj, 'value', []);
    }
  };

  ChartPropertiesService.prototype.updateXYProps = function (currentChartPropsObj) {
    var colIdDataItemNames = this.getDataItemNames('columns');
    if (!currentChartPropsObj['xValue'] && !currentChartPropsObj['yValue']) {
      currentChartPropsObj['xValue'] = _.pick(this.colValues[0], colIdDataItemNames);
      currentChartPropsObj['yValue'] = _.pick(this.colValues[1] || this.colValues[0], colIdDataItemNames);
    } else {
      this.updateColValues(currentChartPropsObj, 'xValue', [], true);
      this.updateColValues(currentChartPropsObj, 'yValue', [currentChartPropsObj['xValue']], true);
      // this.updateColValues(currentChartPropsObj, 'yValue', []);
    }
    if (this.currentVisual.chartType === ChartTypesEnum.BubbleChart && !currentChartPropsObj['bubbleValue']) {
      currentChartPropsObj['bubbleValue'] = _.pick(this.colValues[2] || this.colValues[1] || this.colValues[0], colIdDataItemNames);
    } else if (this.currentVisual.chartType === ChartTypesEnum.BubbleChart) {
      this.updateColValues(currentChartPropsObj, 'bubbleValue', [currentChartPropsObj['xValue'], currentChartPropsObj['yValue']], true);
      // this.updateColValues(currentChartPropsObj, 'bubbleValue', []);
    }
  };

  ChartPropertiesService.prototype.updateColValues = function (currentChartPropsObj, propName, otherColVals, isColumnRepeated) {
    var colIdDataItemNames = this.getDataItemNames('columns');
    currentChartPropsObj[propName] = currentChartPropsObj[propName] || {};
    if (currentChartPropsObj[propName]) {
      let currentColValue = currentChartPropsObj[propName];
      let colValues = _.size(colIdDataItemNames) ? _.map(this.colValues, function (colVal) {
        return _.pick(colVal, colIdDataItemNames);
      }) : [];
      let difference = _.differenceWith(colValues, otherColVals, _.isEqual);
      let isCurrentColValueAvailable = _.find(isColumnRepeated ? colValues : difference, function (colVal) {
        return _.isEqual(colVal, currentColValue);
      });
      if (!isCurrentColValueAvailable) {
        currentChartPropsObj[propName] = _.size(colIdDataItemNames) ? difference[0] || (isColumnRepeated ? otherColVals[_.size(otherColVals) - 1] : null) : {
          value: 'value'
        };
      }
    }
  }

  ChartPropertiesService.prototype.updateSourceTargetChartProps = function (currentChartPropsObj) {
    var colIdDataItemNames = this.getDataItemNames('columns');
    if (!currentChartPropsObj['sourceValue'] && !currentChartPropsObj['targetValue']) {
      currentChartPropsObj['sourceValue'] = _.pick(this.colValues[0], colIdDataItemNames);
      currentChartPropsObj['targetValue'] = _.pick(this.colValues[1], colIdDataItemNames);
    } else {
      this.updateColValues(currentChartPropsObj, 'sourceValue', []);
      this.updateColValues(currentChartPropsObj, 'targetValue', [currentChartPropsObj['sourceValue']]);
    }
    this.mergeWithDefaults(currentChartPropsObj);
  };

  ChartPropertiesService.prototype.updateTileChartProps = function (currentChartPropsObj) {
    var colIdDataItemNames = this.getDataItemNames('columns');
    if (!_.size(currentChartPropsObj.valuesToDisplay)) {
      currentChartPropsObj.valuesToDisplay = _.map(_.slice(this.colValues, 0, 6), function (colVal) {
        return _.pick(colVal, colIdDataItemNames);
      });
    } else {
      let colValues = _.map(this.colValues, function (colVal) {
        return _.pick(colVal, colIdDataItemNames);
      });
      let difference = _.differenceWith(currentChartPropsObj.valuesToDisplay, colValues, _.isEqual);
      let intersectedValues = _.differenceWith(currentChartPropsObj.valuesToDisplay, difference, _.isEqual);
      let union = _.size(intersectedValues) ? intersectedValues : _.unionWith(intersectedValues, colValues, _.isEqual);
      currentChartPropsObj.valuesToDisplay = _.slice(union, 0, 6);
      if (!_.size(intersectedValues)) {
        currentChartPropsObj.columnValues = [];
      }
      currentChartPropsObj.columnValues = _.filter(currentChartPropsObj.columnValues, function (colVal) {
        return _.findIndex(currentChartPropsObj.valuesToDisplay, colVal.value) !== -1;
      });
      _.each(currentChartPropsObj.valuesToDisplay, function (colValue) {
        let currentColVal = _.find(currentChartPropsObj.columnValues, function (colVal) {
          return _.isEqual(colVal.value, colValue);
        });
        if (!currentColVal) {
          currentChartPropsObj.columnValues.push({
            value: colValue,
            isDisabled: false
          });
        }
      });
    }
    if (!_.size(currentChartPropsObj.columnValues)) {
      currentChartPropsObj.columnValues = [];
      currentChartPropsObj.isAllSelected = true;
      _.each(currentChartPropsObj.valuesToDisplay, function (colValue) {
        currentChartPropsObj.columnValues.push({
          value: colValue,
          isDisabled: false
        });
      });
    }
    this.mergeWithDefaults(currentChartPropsObj);
  };

  ChartPropertiesService.prototype.updateMapProps = function (currentMapPropsObj) {
    let _this = this;
    var isNew = _.isEmpty(currentMapPropsObj);
    var isNewMarkerProps = false;
    var outputFormat = _this.metaData.outputFormat;
    var isColumns = _this.mapParametrers.is1toN || _.isEqual(_.intersection(outputFormat.rows, outputFormat.groupedAttrs).sort(), _this.mapParametrers.geoAttribs.sort());
    var formatKey = this.getFormatKey(isColumns ? ReportFormatDimensionsEnum.Columns : ReportFormatDimensionsEnum.Rows);
    if (isNew) {
      currentMapPropsObj.formatKey = formatKey;
    }
    if (currentMapPropsObj.formatKey !== formatKey) {
      currentMapPropsObj.formatKey = formatKey;
      isNewMarkerProps = true;
    }
    if (!_.isEmpty(currentMapPropsObj) && _.size(currentMapPropsObj.markerProperties) > 0) {
      var currentMapMarkerPropsObjKeys = _.keys(currentMapPropsObj.markerProperties[0].value);
      var currentOutputFormatMarkerPropsKeys = _this.getValueKeys(isColumns ? ReportFormatDimensionsEnum.Columns : ReportFormatDimensionsEnum.Rows, isColumns ? [] : _this.mapParametrers.geoAttribs);
      if (!_.isEqual(currentMapMarkerPropsObjKeys.sort(), currentOutputFormatMarkerPropsKeys.sort())) {
        isNewMarkerProps = true;
        currentMapPropsObj.markerProperties = [];
      }
    }
    var defaultObj = _.cloneDeep(this.chartPropertiesDefaults.getDefaultsBasedOnChartType(this.currentVisual.chartType, currentMapPropsObj));
    this.updateAutoColorType(currentMapPropsObj);
    if (currentMapPropsObj.colorType === ColorType.Single && (currentMapPropsObj.isAutoColor || !currentMapPropsObj.color)) {
      currentMapPropsObj.color = this.mapParametrers.isPointMap ? '#000000' : '#CDDBED';
    }
    if (currentMapPropsObj.colorType === ColorType.Gradient) {
      var colIdItems = _this.getDataItemNames(ReportFormatDimensionsEnum.Columns);
      if (_.has(currentMapPropsObj, ['gradient', 'value'])) {
        var isValidValue = _.some(_this.colValues, function (colValue) {
          return _.isEqual(_.pick(colValue, colIdItems), _.pick(currentMapPropsObj.gradient.value, colIdItems));
        });
        if (!isValidValue) {
          currentMapPropsObj.gradient.value = _.pick(_this.colValues[0], colIdItems);
        }
      } else {
        currentMapPropsObj.gradient = {
          value: _.pick(_this.colValues[0], colIdItems)
        }
      }
    } else {
      currentMapPropsObj.gradient = defaultObj.gradient;
    }

    if (currentMapPropsObj.colorType === ColorType.DSFColor) {
      var colIdItems = _this.getDataItemNames(ReportFormatDimensionsEnum.Columns);
      if (_.has(currentMapPropsObj, ['dsfColumn'])) {
        var isValidValue = _.some(_this.colValues, function (colValue) {
          return _.isEqual(_.pick(colValue, colIdItems), _.pick(currentMapPropsObj.dsfColumn, colIdItems));
        });
        if (!isValidValue) {
          currentMapPropsObj.dsfColumn = _.pick(_this.colValues[0], colIdItems);
        }
      } else {
        currentMapPropsObj.dsfColumn = _.pick(_this.colValues[0], colIdItems)
      }
    } else {
      currentMapPropsObj.dsfColumn = defaultObj.dsfColumn;
    }
    if (isColumns) {
      currentMapPropsObj.isColumnProperties = true;
      this.updateChartProps(currentMapPropsObj, null, 'markerProperties', ReportFormatDimensionsEnum.Columns);
    } else {
      currentMapPropsObj.isColumnProperties = false;
      this.updateChartProps(currentMapPropsObj, null, 'markerProperties', ReportFormatDimensionsEnum.Rows, _this.mapParametrers.geoAttribs);
    }
    if (currentMapPropsObj.colorType === ColorType.Attribute) {
      if (!_.has(currentMapPropsObj, ['colorAttributes']) || _.size(_.intersectionWith(currentMapPropsObj.colorAttributes, _this.mapParametrers.nonGeoAttribs)) === 0) {
        currentMapPropsObj.colorAttributes = [_this.mapParametrers.nonGeoAttribs[0]];
        currentMapPropsObj.rowValues = [];
      }
      var attribsToExclude = _.difference(_.intersection(outputFormat.rows, outputFormat.groupedAttrs), currentMapPropsObj.colorAttributes);
      this.updateChartProps(currentMapPropsObj, null, 'rowValues', ReportFormatDimensionsEnum.Rows, attribsToExclude);
    } else {
      currentMapPropsObj.colorAttributes = defaultObj.colorAttributes;
      currentMapPropsObj.rowValues = defaultObj.rowValues;
    }
    this.updateMapMarkerProps(currentMapPropsObj, isNew || isNewMarkerProps, this.mapPropertiesSelectionCount, currentMapPropsObj.isColumnProperties);
    this.mergeWithDefaults(currentMapPropsObj);
  };

  ChartPropertiesService.prototype.updateMapMarkerProps = function (currentChartPropsObj, isNew, valuesCountToEnable, isColumnProps) {
    var _this = this;
    var currentSelectedMarkerTypes = [];
    _.each(currentChartPropsObj.markerProperties, function (markerProp) {
      if (markerProp.markerType && _.indexOf(markerTypes, markerProp.markerType) === -1) {
        currentSelectedMarkerTypes.push(markerProp.markerType);
      }
    });
    var defaultMarkerTypes = [MarkerTypesEnum.Circle, MarkerTypesEnum.Diamond, MarkerTypesEnum.Triangle, MarkerTypesEnum.Square];
    var markerTypes = _.difference(_.cloneDeep(defaultMarkerTypes), currentSelectedMarkerTypes);
    var colDataItemsNames = _.size(_this.metaData.outputFormat.columns) ? _.map(_this.getMultipleDataItems(_this.metaData.outputFormat.columns).idDataItems, function (x) {
      return x.name;
    }) : ['value'];
    _.forEach(currentChartPropsObj.markerProperties, function (markerProperty, index) {
      if (_.size(markerTypes) === 0) {
        markerTypes = _.cloneDeep(defaultMarkerTypes);
      }
      if (!_.has(markerProperty, 'sizeColumn') || _.isEmpty(markerProperty.sizeColumn)) {
        markerProperty.sizeColumn = isColumnProps ? markerProperty.value : _.pick(_this.colValues[0], colDataItemsNames);
        if (isNew) {
          if (index < valuesCountToEnable) {
            markerProperty.isDisabled = false;
          }
        }
        var markerType = markerProperty.markerType ? null : markerTypes[0];
        markerProperty.markerType = markerProperty.markerType || markerTypes[0];
        if (markerType) {
          markerTypes.splice(0, 1);
        }
      } else {
        _this.validateAndUpdateMapSizeColumnField(markerProperty, isColumnProps, colDataItemsNames);
      }
      _this.validateAndUpdateMapDataLabelColumns(markerProperty, isColumnProps, colDataItemsNames);
    });
  };

  ChartPropertiesService.prototype.validateAndUpdateMapSizeColumnField = function (markerProperty, isColumnProps, colDataItemsNames) {
    if (markerProperty.isDisabled) {
      return;
    }
    var _this = this;
    var sizeColumnProps = _.keys(markerProperty.sizeColumn);
    var isSizeColumnAvailable = _.isEqual(sizeColumnProps, colDataItemsNames) && _.some(_this.colValues, function (colVal, indx) {
      return _.isEqual(markerProperty.sizeColumn, _.pick(colVal, colDataItemsNames));
    });
    if (!isSizeColumnAvailable) {
      markerProperty.sizeColumn = isColumnProps ? markerProperty.value : _.pick(_this.colValues[0], colDataItemsNames);
    }
  };

  ChartPropertiesService.prototype.validateAndUpdateMapDataLabelColumns = function (markerProperty, isColumnProps, colDataItemsNames) {
    var _this = this;
    if (markerProperty.isDataLabelEnabled && !isColumnProps) {
      var dataLabelColumnProps = _.keys(markerProperty.dataLabelColumns[0]);
      markerProperty.dataLabelColumns = _.isEqual(dataLabelColumnProps, colDataItemsNames) ?
        _this.commonUtilsService.getIntersectedValues(_this.colValues, markerProperty.dataLabelColumns, colDataItemsNames, true) : [];
      if (!_.size(markerProperty.dataLabelColumns)) {
        markerProperty.dataLabelColumns = [_.pick(_this.colValues[0], colDataItemsNames)];
      }
    }
  };

  ChartPropertiesService.prototype.getValuePropertyName = function () {
    var chartType = this.currentVisual.chartType;
    switch (chartType) {
      case ChartTypesEnum.FunnelChart:
      case ChartTypesEnum.PieChart:
      case ChartTypesEnum.TreeChart:
        return 'rowProperties';
      case ChartTypesEnum.BubbleChart:
      case ChartTypesEnum.ScatterChart:
        return 'attribValueProperties';
      case ChartTypesEnum.Map:
        return 'markerProperties';
      case ChartTypesEnum.TileChart:
        return 'columnValues';
      default:
        return 'columnProperties';
    }
  };


  ChartPropertiesService.prototype.updateChartProps = function (currentChartPropsObj, props, propName, dimension, attribsToExclude) {
    var _this = this;
    var propName = propName || _this.getValuePropertyName();
    var colorType = _this.currentVisual.chartType === ChartTypesEnum.Map ? 'mapColor' : (currentChartPropsObj && currentChartPropsObj['colorType']);
    if (!currentChartPropsObj[propName]) {
      currentChartPropsObj[propName] = [];
    }
    var isYOYChart = this.currentVisual.chartType === ChartTypesEnum.YearOnYearChart;
    var properties = [];
    var dimension = dimension || this.getDimensionForColumnProperties();
    var valueIdDataItemNames = this.getDataItemNames(dimension, null, null, attribsToExclude);
    var values = _this.getValues(dimension, attribsToExclude, currentChartPropsObj);
    var bubbleColor;
    var bubbleAttribDataItems;
    if (_.indexOf(_this.XYCharts, _this.currentVisual.chartType) > -1) {
      if (_.size(values) === 0) {
        properties = _.cloneDeep(currentChartPropsObj.attribValueProperties);
      }
      if (!props) {
        bubbleColor = (currentChartPropsObj.attribValueProperties && _.size(currentChartPropsObj.attribValueProperties) && !currentChartPropsObj.isAutoColor && currentChartPropsObj.colorType === ColorType.Single) ? (currentChartPropsObj.attribValueProperties[0].color || '#ffa500') : ((currentChartPropsObj.isAutoColor || !_.has(currentChartPropsObj, 'isAutoColor')) && currentChartPropsObj.colorType === ColorType.Single ? '#ffa500' : null);
      }
      if (currentChartPropsObj.attributeName) {
        bubbleAttribDataItems = _.map(this.getDataItems(currentChartPropsObj.attributeName).idDataItems, function (x) {
          return x.name
        });
      }
    }
    if (isYOYChart) {
      let yearValues = _this.getYearValues(values);
      values = yearValues;
      valueIdDataItemNames = ['year'];
    }

    var _this = this;
    var colorIndex = 0;
    valueIdDataItemNames = _.size(valueIdDataItemNames) ? valueIdDataItemNames : 'value';
    var keys = _.size(currentChartPropsObj[propName]) ? _.keys(currentChartPropsObj[propName][0].value) : [];
    var currentSelectedValues = _.size(keys) ? this.commonUtilsService.getIntersectedValues(currentChartPropsObj[propName], values, keys, false, 'value') : [];
    var currentSelectedColors = [];
    for (var currentSelectedValIndx = 0; currentSelectedValIndx < _.size(currentSelectedValues); currentSelectedValIndx++) {
      var selectedValue = currentSelectedValues[currentSelectedValIndx];
      if (((_.has(selectedValue, 'isDisabled') && !selectedValue.isDisabled && selectedValue.color) ||
          (!_.has(selectedValue, 'isDisabled') && selectedValue.color)) && currentSelectedColors.indexOf(selectedValue.color) === -1) {
        currentSelectedColors.push(selectedValue.color);
      }
      if (_.size(currentSelectedColors) >= _.size(Defaults.colors)) {
        break;
      }
    }
    var colors = _.differenceWith(_.cloneDeep(Defaults.colors), currentSelectedColors, function (a, b) {
      return a.toLowerCase() === b.toLowerCase();
    });
    for (var i = 0; i < values.length; i++) {
      var value = values[i];
      if (_.size(colors) === 0) {
        colors = _.cloneDeep(Defaults.colors);
      }
      if (bubbleAttribDataItems) {
        bubbleColor = undefined;
        let valueInProps = _.find(properties, function (prop) {
          return _.isEqual(_.pick(prop.value, bubbleAttribDataItems), _.pick(value, bubbleAttribDataItems));
        });
        if (valueInProps) {
          bubbleColor = valueInProps.color;
          colorIndex--;
        }
      }

      let currentValueIndex = null;
      var currentValue = _.find(currentChartPropsObj[propName], function (currentChartProps, currentValueIndex) {
        if (_.isEqual(_.pick(currentChartProps.value, valueIdDataItemNames), _.pick(value, valueIdDataItemNames))) {
          currentValueIndex = currentValueIndex;
          return true;
        }
      });

      if (!currentValue) {
        properties.push({
          'value': _.pick(value, valueIdDataItemNames),
          'color': bubbleColor || _this.getColorBasedOnColorType(colorType, currentValue, value, colorIndex, dimension, currentChartPropsObj['color'], currentChartPropsObj['isAutoColor'], currentChartPropsObj, colors)
        });
      } else {
        if (_.has(currentValue, 'isDisabled') && currentValue.isDisabled) {
          delete currentValue['color'];
        }
        currentValue['color'] = bubbleColor || _this.getColorBasedOnColorType(colorType, currentValue, value, colorIndex, dimension, currentChartPropsObj['color'], currentChartPropsObj['isAutoColor'], currentChartPropsObj, colors);
        currentValue['value'] = _.pick(value, valueIdDataItemNames);
        currentChartPropsObj[propName].splice(currentValueIndex, 1);
        properties.push(currentValue);
      }
      colorIndex++;
    }
    if (this.currentVisual.chartType === ChartTypesEnum.PieChart || this.currentVisual.chartType === ChartTypesEnum.FunnelChart) {
      let othersValue = {};
      othersValue[_.join(valueIdDataItemNames, '_')] = 'others';
      _.forEach(valueIdDataItemNames, function (valueIdDataItemName) {
        othersValue[valueIdDataItemName] = 'others';
      });
      let otherValueInCurrentProps = _.find(currentChartPropsObj[propName], function (currentChartProps) {
        return _.isEqual(_.pick(currentChartProps.value, valueIdDataItemNames), _.pick(othersValue, valueIdDataItemNames));
      });
      properties.push({
        value: othersValue,
        color: (otherValueInCurrentProps && otherValueInCurrentProps['color']) || _this.commonUtilsService.getColor(colorIndex)
      });
    }
    if (!_.has(currentChartPropsObj, propName)) {
      currentChartPropsObj[propName] = properties;
    } else {
      currentChartPropsObj[propName].splice(0, _.size(currentChartPropsObj[propName]));
      Array.prototype.push.apply(currentChartPropsObj[propName], properties);
    }
  };

  ChartPropertiesService.prototype.getValueKeys = function (dimension, attribsToExclude) {
    var _this = this;
    var outputFormat = _this.metaData.outputFormat;
    var attribsToInclude = _.difference(_.intersection(outputFormat[dimension], outputFormat.groupedAttrs), attribsToExclude || []);
    var idDataItemNames = _.map(_this.getMultipleDataItems(attribsToInclude).idDataItems, function (x) {
      return x.name;
    });
    return _.size(idDataItemNames) ? idDataItemNames : ['value'];
  };

  ChartPropertiesService.prototype.getValues = function (dimension, attribsToExclude, currentChartPropsObj) {
    var _this = this;
    var values = dimension === ReportFormatDimensionsEnum.Rows ? this.rowValues : this.colValues;

    if (_.size(attribsToExclude)) {
      var idDataItemNames = _this.getValueKeys(dimension, attribsToExclude);
      values = _this.getUniqueVals(values, idDataItemNames);
    }

    if (currentChartPropsObj && this.currentVisual.chartType === ChartTypesEnum.Map && (currentChartPropsObj.colorType === ColorType.Gradient || currentChartPropsObj.colorType === ColorType.DSFColor)) {
      var selectedColumn = currentChartPropsObj.colorType === ColorType.Gradient ? currentChartPropsObj.gradient.value : currentChartPropsObj.dsfColumn;
      values = _.filter(values, function (val) {
        return !_.isEqual(_.pick(val, _.keys(selectedColumn)), selectedColumn);
      });
    }
    return values;
  };

  ChartPropertiesService.prototype.getYearValues = function (values) {
    let displayItem = this.getDataItemNames('rows', 'displayDataItems')[0];
    let displayItemFormat = this.getDataItemNames('rows', 'displayDataItems', 'format')[0];
    let yearValues = [];
    _.forEach(values, function (value) {
      let isValid = moment(value[displayItem], displayItemFormat).isValid();
      if (isValid) {
        let years = _.map(yearValues, function (yearValue) {
          return yearValue.year;
        });
        var year = moment(value[displayItem], displayItemFormat).year();
        if (year && _.indexOf(years, year) === -1) {
          yearValues.push({
            year: year
          });
        }
      }
    });
    return _.orderBy(yearValues, 'year', 'desc');
  };

  ChartPropertiesService.prototype.getUniqueVals = function (array, props) {
    return _.uniqWith(_.map(array, function (x) {
      return _.pick(x, props)
    }), _.isEqual);
  };

  ChartPropertiesService.prototype.getColorBasedOnColorType = function (colorType, currentProp, value, index, dimension, singleColor, isAutoColor, chartPropsObj, colors) {
    var _this = this;
    colorType = colorType || this.getDefaultColorType(chartPropsObj);
    var color = '';
    switch (colorType) {
      case ColorType.Custom:
        color = (!isAutoColor && currentProp && currentProp['color']) || colors[0] || _this.commonUtilsService.getColor(index);
        if (!(!isAutoColor && currentProp && currentProp['color'])) {
          colors.splice(0, 1);
        }
        break;
      case ColorType.StandardPalette:
        color = _this.commonUtilsService.getColor(index);
        break;
      case ColorType.Single:
        color = singleColor || '#0099ff';
        break;
      case ColorType.DBColor:
        var colorField = _this.checkForDbColors(dimension);
        color = value[colorField] || _this.commonUtilsService.getColor(index);
        break;
      default:
        color = (currentProp && currentProp['color']) || colors[0] || _this.commonUtilsService.getColor(index);
        if (!(currentProp && currentProp['color'])) {
          colors.splice(0, 1);
        }
        break;
    }
    return color;
  };

  ChartPropertiesService.prototype.getDimensionForColumnProperties = function () {
    var chartType = this.currentVisual.chartType;
    var dimension = ReportFormatDimensionsEnum.Rows;
    switch (chartType) {
      case ChartTypesEnum.BarChart:
      case ChartTypesEnum.ColumnChart:
      case ChartTypesEnum.PieChart:
      case ChartTypesEnum.FunnelChart:
      case ChartTypesEnum.YearOnYearChart:
        dimension = ReportFormatDimensionsEnum.Rows;
        break;
      case ChartTypesEnum.ClusteredBarChart:
      case ChartTypesEnum.ClusteredColumnChart:
      case ChartTypesEnum.StackBarChart:
      case ChartTypesEnum.StackColumnChart:
      case ChartTypesEnum.ComboChart:
      case ChartTypesEnum.LineChart:
      case ChartTypesEnum.StackLineChart:
      case ChartTypesEnum.AreaChart:
      case ChartTypesEnum.StackAreaChart:
        dimension = ReportFormatDimensionsEnum.Columns;
        break;
    }
    return dimension;
  }

  ChartPropertiesService.prototype.getDataItemNames = function (dimension, dataItemType, prop, attributesToExclude) {
    dataItemType = dataItemType || 'idDataItems';
    var outputFormat = this.metaData.outputFormat;
    var allAttribsDataItemMap = this.metaData.allAttribsDataItemMap;
    var dimensionAttributes = _.difference(_.intersection(outputFormat[dimension], outputFormat.groupedAttrs), attributesToExclude || []);
    var dataItemNames = [];
    if (_.size(dimensionAttributes)) {
      _.forEach(dimensionAttributes, function (attribute) {
        var dataItems = _.map(allAttribsDataItemMap[attribute][dataItemType], function (dataItem) {
          return prop ? dataItem[prop] : dataItem.name;
        });
        Array.prototype.push.apply(dataItemNames, dataItems);
      });
    } else {
      dataItemNames.push('value');
    }
    return dataItemNames;
  };


  ChartPropertiesService.prototype.getDefaultsForCurrentObj = function (currentObj, defaultObject) {
    if (!defaultObject) {
      return currentObj;
    }
    for (var prop in defaultObject) {
      if (_.has(currentObj, prop)) {
        if (Array.isArray(currentObj[prop])) {
          for (var obj in currentObj[prop]) {
            currentObj[prop][obj] = this.getDefaultsForCurrentObj(currentObj[prop][obj], defaultObject[prop][0]);
          }
        } else if (_.isObject(currentObj[prop])) {
          currentObj[prop] = this.getDefaultsForCurrentObj(currentObj[prop], defaultObject[prop]);
        }
      } else {
        currentObj[prop] = defaultObject[prop];
      }
    }
    return currentObj;
  };

  ChartPropertiesService.prototype.getDifference = function (currentObj, defaultObj, diffObj, propsToIgnore, propsToCheck, arrayPropsToIgnore, mandatoryPropsObj) {
    if (!defaultObj || !currentObj) {
      return currentObj;
    }
    for (var prop in defaultObj) {
      if (Array.isArray(defaultObj[prop])) {
        diffObj[prop] = [];
        for (var index in currentObj[prop]) {
          var arrayLength = diffObj[prop].length;
          diffObj[prop][arrayLength] = {};
          diffObj[prop][arrayLength] = this.getDifference(currentObj[prop][index], defaultObj[prop][0], diffObj[prop][arrayLength], arrayPropsToIgnore, propsToCheck, [], mandatoryPropsObj);
          if (Object.keys(diffObj[prop][arrayLength]).length === 0) {

            diffObj[prop].pop();
          }
        }
        if (!_.size(diffObj[prop])) {
          delete diffObj[prop];
        }
      } else if (_.isObject(defaultObj[prop])) {
        diffObj[prop] = {};
        diffObj[prop] = this.getDifference(currentObj[prop], defaultObj[prop], diffObj[prop], propsToIgnore, propsToCheck);
        if (_.isEmpty(diffObj[prop])) {
          delete diffObj[prop];
        }
      } else if (currentObj[prop] !== defaultObj[prop] && _.indexOf(propsToIgnore, prop) === -1) {
        if (!_.isUndefined(currentObj[prop]) && !_.isNull(currentObj[prop])) {
          diffObj[prop] = currentObj[prop];
        }
      }
    }
    if (_.isEqual((propsToCheck || []).sort(), _.keys(diffObj).sort())) {
      diffObj = {};
    }
    _.forOwn(mandatoryPropsObj, function (value, key) {
      if (_.has(diffObj, key) && diffObj[key] === value.validValue) {
        if (value.propsToPick) {
          diffObj = _.pick(diffObj, value.propsToPick);
        } else {
          diffObj = {};
        }
      }
    });
    return diffObj;
  };

  ChartPropertiesService.prototype.getDefaultColorType = function (properties) {
    var _this = this;
    var isRowChart = _this.isRowColorChart();
    var isColorApplicable = _.includes(_this.getColorConditionApplicableCharts(), _this.currentVisual.chartType);
    var isDsfAvailable = isColorApplicable && _.size(_this.getColorConditions()) > 0;
    var dbColorField = isRowChart ? _this.checkForDbColors(ReportFormatDimensionsEnum.Rows) : _this.checkForDbColors(ReportFormatDimensionsEnum.Columns);
    var colorType = ColorType.StandardPalette;
    if (_this.currentVisual.chartType === ChartTypesEnum.ScatterChart || _this.currentVisual.chartType === ChartTypesEnum.BubbleChart) {
      if (properties && properties.attributeName) {
        colorType = ColorType.StandardPalette;
      } else {
        colorType = ColorType.Single;
      }
    }
    if (this.currentVisual.chartType === ChartTypesEnum.Map) {
      colorType = this.getDefaultColorTypeForMap();
    } else if (dbColorField && this.currentVisual.chartType !== ChartTypesEnum.YearOnYearChart) {
      colorType = ColorType.DBColor;
    } else if (isDsfAvailable) {
      colorType = ColorType.DSFColor;
    }
    return colorType;
  };

  ChartPropertiesService.prototype.getDefaultColorTypeForMap = function () {
    let _this = this;
    var outputFormat = _this.metaData.outputFormat;
    if (_this.mapParametrers.is1toN) {
      return ColorType.Attribute;
    } else if (_.size(_.intersection(outputFormat.rows, outputFormat.groupedAttrs)) === 1) {
      return ColorType.Gradient;
    } else {
      return ColorType.Single;
    }
  };

  ChartPropertiesService.prototype.getColorTypes = function (properties) {
    let _this = this;
    let isRowChart = _this.isRowColorChart();
    let isColorApplicable = _.includes(_this.getColorConditionApplicableCharts(), _this.currentVisual.chartType);
    let isDsfAvailable = isColorApplicable && _.size(_this.getColorConditions()) > 0;
    let dbColorField = this.currentVisual.chartType !== ChartTypesEnum.Map ? (isRowChart ? _this.checkForDbColors(ReportFormatDimensionsEnum.Rows) : _this.checkForDbColors(ReportFormatDimensionsEnum.Columns)) : this.getDbColorForMap();
    let colorTypes = [];
    if (_this.currentVisual.chartType === ChartTypesEnum.YearOnYearChart) {
      colorTypes.push(ColorType.StandardPalette);
      colorTypes.push(ColorType.Custom);
      return colorTypes;
    }
    if (isRowChart) {
      if (dbColorField) {
        colorTypes.push(ColorType.DBColor);
      }
      if (isDsfAvailable && this.currentVisual.chartType !== ChartTypesEnum.Map) {
        colorTypes.push(ColorType.DSFColor);
      }
      if (_.includes(_this.singleColorCharts, _this.currentVisual.chartType)) {
        colorTypes.push(ColorType.Single);
      }
    } else {
      if (dbColorField) {
        colorTypes.push(ColorType.DBColor);
      }
    }
    if (!_.includes(_this.XYCharts, _this.currentVisual.chartType)) {
      colorTypes.push(ColorType.StandardPalette);
      if (_.size(_this.currentVisual.format.rows.hierarchies) > 0) {
        colorTypes.push(ColorType.Custom);
      }
    } else {
      if (!!properties.attributeName) {
        colorTypes.push(ColorType.StandardPalette);
        colorTypes.push(ColorType.Custom);
      } else {
        colorTypes.push(ColorType.Single);
      }
    }
    if (_this.currentVisual.chartType === ChartTypesEnum.Map) {
      colorTypes.push(ColorType.None);
      if (_this.mapParametrers.is1toN) {
        colorTypes.push(ColorType.Attribute);
      }
      var outputFormat = _this.metaData.outputFormat;
      var geoAttribsCount = _.size(_.intersection(outputFormat.rows, outputFormat.groupedAttrs, _this.mapParametrers.geoAttribs));
      if (geoAttribsCount === 1 && (_.size(_this.mapParametrers.nonGeoAttribs) === 0 || _this.mapParametrers.is1toN)) {
        colorTypes.push(ColorType.Gradient);
        if (isDsfAvailable) {
          colorTypes.push(ColorType.DSFColor);
        }
      }
    }
    return colorTypes;
  };


  ChartPropertiesService.prototype.getDbColorForMap = function () {
    var _this = this;
    var outputFormat = this.metaData.outputFormat;
    var geoAttribs = _this.mapParametrers.geoAttribs;
    return _this.checkForDbColors(null, _.intersection(geoAttribs, outputFormat.groupedAttrs));
  };

  ChartPropertiesService.prototype.getColorConditions = function () {
    var reportInfo = this.metaData.reportInfo.reportInfo;
    return reportInfo.dsFunctions && reportInfo.dsFunctions.logicalDSFunctions.length > 0 ? _.filter(reportInfo.dsFunctions.logicalDSFunctions, function (x) {
      return x.uiInfos && x.uiInfos.conditionType && x.uiInfos.conditionType === 'color';
    }) : [];
  };

  ChartPropertiesService.prototype.checkForDbColors = function (dimension, attributes) {
    let _this = this;
    var colorField = '';
    var outputFormat = _this.metaData.outputFormat;
    var isNested = _this.isSingleNestedHierarchyInRows();
    var dimensionAttributes = attributes || outputFormat[dimension];
    var colorAttributeIndex;
    if (_.size(dimensionAttributes) === 1 || isNested) {
      var colorAttributes = {};
      _.forEach(dimensionAttributes, function (dimensionAttribute, index) {
        var colorAttribute = _this.getColorAttribute(dimensionAttribute);
        if (colorAttribute) {
          if (_.isNull(colorAttributeIndex) || _.isUndefined(colorAttributeIndex)) {
            colorAttributeIndex = index;
          }
          colorAttributes[dimensionAttribute] = colorAttribute;
        }
      });
      if (_.size(_.keys(colorAttributes)) === 1 || isNested) {
        colorField = isNested ? (colorAttributeIndex === 0 && _.size(_.keys(colorAttributes)) > 0 ? colorAttributes[_.keys(colorAttributes)[0]] : '') : colorAttributes[_.keys(colorAttributes)[0]];
      }
    }
    return colorField;
  };

  ChartPropertiesService.prototype.getColorAttribute = function (attributeName) {
    var colorAttribute;
    var attributeDataItems = this.metaData.allAttribsDataItemMap[attributeName];
    if (_.has(attributeDataItems, 'colorDataItems') && _.size(attributeDataItems.colorDataItems)) {
      colorAttribute = attributeDataItems.colorDataItems[0].name;
    }
    return colorAttribute;
  };

  ChartPropertiesService.prototype.isSingleNestedHierarchyInRows = function () {
    var currentRowHierarchies = this.getDimensionHierarchies(ReportFormatDimensionsEnum.Rows);
    return _.size(currentRowHierarchies.hierarchies) === 1 && currentRowHierarchies.hierarchies[0].type === ReportFormatHierarchyType.Nested;
  };


  ChartPropertiesService.prototype.isRowColorChart = function () {
    var rowColorCharts = [ChartTypesEnum.BarChart, ChartTypesEnum.ColumnChart, ChartTypesEnum.PieChart, ChartTypesEnum.FunnelChart, ChartTypesEnum.TreeChart, ChartTypesEnum.BubbleChart, ChartTypesEnum.ScatterChart, ChartTypesEnum.Map];
    return _.includes(rowColorCharts, this.currentVisual.chartType);
  };

  ChartPropertiesService.prototype.getColorConditionApplicableCharts = function () {
    var colorConditionsApplicableCharts = [ChartTypesEnum.BarChart, ChartTypesEnum.ColumnChart, ChartTypesEnum.PieChart, ChartTypesEnum.FunnelChart, ChartTypesEnum.TreeChart, ChartTypesEnum.BubbleChart, ChartTypesEnum.Map];
    return colorConditionsApplicableCharts;
  };

  ChartPropertiesService.prototype.getDimensionHierarchies = function (dimension) {
    return this.currentVisual.format[dimension];
  };

  ChartPropertiesService.prototype.getMultipleDataItems = function (attributeNames) {
    let _this = this;
    var allDataItems = {
      idDataItems: [],
      displayDataItems: [],
      sortDataItems: [],
      colorDataItems: []
    };
    _.forEach(attributeNames, function (attributeName) {
      var attributeDataItems = _this.metaData.allAttribsDataItemMap[attributeName];
      Array.prototype.push.apply(allDataItems.idDataItems, attributeDataItems.idDataItems);
      Array.prototype.push.apply(allDataItems.displayDataItems, attributeDataItems.displayDataItems);
      Array.prototype.push.apply(allDataItems.sortDataItems, attributeDataItems.sortDataItems);
      if (_.size(attributeDataItems.colorDataItems)) {
        Array.prototype.push.apply(allDataItems.colorDataItems, attributeDataItems.colorDataItems);
      }
    });
    return allDataItems;
  };

  ChartPropertiesService.prototype.getDataItems = function (attributeName) {
    var attributeDataItems = this.metaData.allAttribsDataItemMap[attributeName];
    return attributeDataItems;
  };

  ChartPropertiesService.prototype.applyDSFForChartProperties = function (currentVisual, currentChartPropsObj, rowValues, colValues, metaData, dsFunctions, gridKey, measureValue) {
    let _this = this;
    _this.setChartPropertiesMetaData(currentVisual, metaData, rowValues, colValues);
    let colKey = _this.getColKey(currentChartPropsObj);
    var propertyName = _this.getValuePropertyName();
    _.each(currentChartPropsObj[propertyName], function (currentChartProperty, index) {
      _this.applyDSFPerChartProperty(currentChartPropsObj, currentChartProperty, index, dsFunctions, colKey, gridKey, measureValue);
    });
  };

  ChartPropertiesService.prototype.getColKey = function (currentChartPropsObj) {
    let _this = this;
    let colIdDataItemNames = _this.getDataItemNames(ReportFormatDimensionsEnum.Columns);
    let colKey;
    if (_.size(colIdDataItemNames)) {
      if (_this.currentVisual.chartType === ChartTypesEnum.BubbleChart) {
        colKey = _this.commonUtilsService.getConcatenatedValues(currentChartPropsObj.bubbleValue, colIdDataItemNames, '_');
      } else {
        colKey = _this.commonUtilsService.getConcatenatedValues(currentChartPropsObj.value, colIdDataItemNames, '_');
      }
    }
    return colKey;
  };

  ChartPropertiesService.prototype.applyDSFPerChartProperty = function (chartProperties, chartProperty, index, dsFunctions, colKey, gridKey, measureValue) {
    let _this = this;
    chartProperty.color = null;
    let keys = [];
    if (gridKey) {
      keys.push(gridKey);
    }
    if (colKey === 'value') {
      colKey = '';
    }
    let rowIdItemNames = this.getDataItemNames(ReportFormatDimensionsEnum.Rows);
    if (_.size(rowIdItemNames)) {
      let rowKey = _this.commonUtilsService.getConcatenatedValues(chartProperty.value, rowIdItemNames, '_');
      if (rowKey) {
        keys.push(rowKey);
      }
    }
    if (colKey) {
      keys.push(colKey);
    }
    let key = _.join(keys, '_');
    let chartTypesInfo = _this.getChartTypesInfo();
    if (_.has(dsFunctions, key)) {
      if (!measureValue) {
        var isMeasureOnRows = _.indexOf(this.metaData.outputFormat.rows, 'MEASURE') !== -1;
        var isMeasureOnPages = _.indexOf(this.metaData.outputFormat.pages, 'MEASURE') !== -1;
        if (isMeasureOnRows) {
          measureValue = chartProperty.value['MEASURE'];
        } else if (!isMeasureOnRows && !isMeasureOnPages) {
          if (chartTypesInfo.isBubbleChart) {
            measureValue = chartProperties.bubbleValue['MEASURE'];
          } else if (chartTypesInfo.isPieVariantChart || chartTypesInfo.isBarVariantChart || chartTypesInfo.isTreeChart) {
            measureValue = chartProperties.value['MEASURE'];
          }
        }
      }
      let dsInfo = dsFunctions[key][measureValue];
      if (dsInfo) {
        chartProperty.color = dsInfo.cellColor;
      }
    }
    chartProperty.color = chartProperty.color || _this.commonUtilsService.getColor(index);
  };

  ChartPropertiesService.prototype.getChartTypesInfo = function () {
    let isBubbleChart = this.currentVisual.chartType === ChartTypesEnum.BubbleChart;
    let isPieVariantChart = _.includes([ChartTypesEnum.PieChart, ChartTypesEnum.FunnelChart], this.currentVisual.chartType);
    let isBarVariantChart = _.includes([ChartTypesEnum.BarChart, ChartTypesEnum.ColumnChart], this.currentVisual.chartType);
    let isTreeChart = this.currentVisual.chartType === ChartTypesEnum.TreeChart;
    let chartTypesInfo = {
      isBarVariantChart: isBarVariantChart,
      isPieVariantChart: isPieVariantChart,
      isTreeChart: isTreeChart,
      isBubbleChart: isBubbleChart
    };
    return chartTypesInfo;
  };

  ChartPropertiesService.prototype.isColumnSelectionCharts = function () {
    var columnSelectionCharts = [ChartTypesEnum.BarChart, ChartTypesEnum.ColumnChart, ChartTypesEnum.ClusteredBarChart, ChartTypesEnum.ClusteredColumnChart, ChartTypesEnum.StackBarChart, ChartTypesEnum.StackColumnChart, ChartTypesEnum.LineChart, ChartTypesEnum.AreaChart, ChartTypesEnum.StackLineChart, ChartTypesEnum.StackAreaChart, ChartTypesEnum.YearOnYearChart, ChartTypesEnum.ComboChart, ChartTypesEnum.LineChart, ChartTypesEnum.AreaChart, ChartTypesEnum.StackAreaChart, ChartTypesEnum.StackLineChart, ChartTypesEnum.TileChart];
    var currentChartType = this.currentVisual.chartType;
    return columnSelectionCharts.indexOf(currentChartType) > -1;
  }

  ChartPropertiesService.prototype.isNestedHierarchyInRows = function () {
    let currentRowHierarchies = this.getDimensionHierarchies(ReportFormatDimensionsEnum.Rows);
    return _.some(currentRowHierarchies.hierarchies, function (currentRowHierarhy) {
      return currentRowHierarhy.type === ReportFormatHierarchyType.Nested
    });
  };

  ChartPropertiesService.prototype.updateAttributeName = function (currentChartPropsObj) {
    let _this = this;
    if (currentChartPropsObj && currentChartPropsObj.attributeName && this.isNestedHierarchyInRows()) {
      var nestedHierarchy = _.find(_this.getDimensionHierarchies(ReportFormatDimensionsEnum.Rows).hierarchies, function (hierarchy) {
        return hierarchy.type === ReportFormatHierarchyType.Nested;
      });
      currentChartPropsObj.attributeName = currentChartPropsObj.attributeName === nestedHierarchy.attributes[0].name ? currentChartPropsObj.attributeName : null;
    }
  };

  ChartPropertiesService.prototype.updateColorForNestedData = function (currentVisual, currentChartPropsObj, rowValues, colValues, metaData, data, dsFunctions, gridValues, measureValue) {
    let _this = this;
    _this.setChartPropertiesMetaData(currentVisual, metaData, rowValues, colValues);
    var colorTypesToBeUpdatedInNested = [ColorType.DBColor, ColorType.DSFColor, ColorType.Custom, ColorType.Single, ColorType.StandardPalette];
    var chartProps = currentChartPropsObj;
    var nestedColorInfoObj = {};
    var childConfigColorObj = {};
    if (_this.isRowColorChart() && _this.isNestedHierarchyInRows() && _.includes(colorTypesToBeUpdatedInNested, chartProps.colorType)) {
      var nestedHierarchy = _.find(_this.getDimensionHierarchies(ReportFormatDimensionsEnum.Rows).hierarchies, function (hierarchy) {
        return hierarchy.type === ReportFormatHierarchyType.Nested;
      });
      var otherHierarchies = _.filter(_this.getDimensionHierarchies(ReportFormatDimensionsEnum.Rows).hierarchies, function (hierarchy) {
        return hierarchy.type !== ReportFormatHierarchyType.Nested
      });
      let colKey = _this.getColKey(currentChartPropsObj);
      var rowIdDataItems = _this.getDataItemNames(ReportFormatDimensionsEnum.Rows);
      var propName = _this.getValuePropertyName();
      _.forEach(data, function (record, recordIndex) {
        var level = record['level'] || 0;
        var currentAttribute = nestedHierarchy.attributes[level];
        var otherHierarchyAttributes = _.map(otherHierarchies, function (hier) {
          return _.find(hier.attributes, function (attr) {
            return attr.name === hier.currentAttribute
          });
        });
        var parentAttributes = level > 0 ? _.concat(nestedHierarchy.attributes.slice(0, level), otherHierarchyAttributes) : null;
        var colorAttribute = _this.isSingleNestedHierarchyInRows() ? _this.getColorAttribute(currentAttribute.name) : null;
        var currentRecordChartProp = _.find(currentChartPropsObj[propName], function (currentChartProp) {
          return _.isEqual(_.pick(currentChartProp.value, rowIdDataItems), _.pick(record, rowIdDataItems));
        });
        if (colorAttribute && (chartProps.colorType === ColorType.DBColor || chartProps.isAutoColor) && level === 0) {
          currentRecordChartProp.color = record[colorAttribute] || _this.commonUtilsService.getColor(recordIndex);
        } else {
          if (level === 0) {
            if (_.size(dsFunctions) && (chartProps.isAutoColor || chartProps.colorType === ColorType.DSFColor)) {
              _this.applyDSFPerChartProperty(currentChartPropsObj, currentRecordChartProp, recordIndex, dsFunctions, colKey, null, measureValue);
            } else {
              currentRecordChartProp.color = currentRecordChartProp.color || _this.commonUtilsService.getColor(record['index'] || recordIndex);
            }
          } else {
            if (_.size(dsFunctions) && (chartProps.isAutoColor || chartProps.colorType === ColorType.DSFColor)) {
              if (!currentRecordChartProp) {
                var idItems = _.map(_this.getMultipleDataItems(_.map(parentAttributes, function (x) {
                  return x.name
                })).idDataItems, function (x) {
                  return x.name
                });
                var parentRecordChartProp = _.cloneDeep(_.find(currentChartPropsObj[propName], function (chartValueProp) {
                  return _.isEqual(_.pick(chartValueProp.value, idItems), _.pick(record, idItems));
                }));

                currentRecordChartProp = parentRecordChartProp;
                currentRecordChartProp.value = _.pick(record, rowIdDataItems);
                currentRecordChartProp.color = null;
                currentChartPropsObj[propName].splice(recordIndex, 0, currentRecordChartProp);
              }
              _this.applyDSFPerChartProperty(currentChartPropsObj, currentRecordChartProp, recordIndex, dsFunctions, colKey, null, measureValue);
            } else {
              if (colorAttribute && (chartProps.colorType === ColorType.DBColor || chartProps.isAutoColor)) {
                childConfigColorObj[recordIndex] = record[colorAttribute];
              }
              var value = _this.currentVisual.chartType !== ChartTypesEnum.BubbleChart ? currentChartPropsObj.value : currentChartPropsObj.bubbleValue;
              _this.getParentAttributeColor(currentChartPropsObj, data, record, recordIndex, parentAttributes, level - 1, nestedColorInfoObj, value);
            }
          }
        }
        ''
      });
      if (chartProps.colorType !== ColorType.DSFColor) {
        _.forOwn(nestedColorInfoObj, function (value, key) {
          var parentIndex = parseInt(key.substring(0, (_.size(key) - 1)));
          var parentRecord = data[parentIndex];
          var parentPropIndex = 0;
          var parentRecordChartProp = _.find(currentChartPropsObj[propName], function (chartValueProp, propIndex) {
            if (_.isEqual(_.pick(chartValueProp.value, rowIdDataItems), _.pick(parentRecord, rowIdDataItems))) {
              parentPropIndex = propIndex;
              return true;
            }
          });
          var parentColor = parentRecordChartProp.color;
          var parentLightColor = _this.commonUtilsService.getLighterColorCode(parentColor, 40);
          var dataForRangeSet = _.concat(value['children'], [
            //     {
            //     value: value['parentValue']
            // }
          ]);
          var rangeSet = _this.reportColumnService.getColorColumnRangeSet(dataForRangeSet, ['value'], 5);
          var children = value['children']
          // _.orderBy(value['children'], 'value', 'desc');
          var partitionCount = _.size(value['children']) + 1;
          _.forEach(children, function (child, indx) {
            var childRecord = data[child['childIndex']];
            var chilRecordConfigColor = childConfigColorObj[child['childIndex']];
            var childRecordChartProp = _.find(currentChartPropsObj[propName], function (chartValueProp) {
              return _.isEqual(_.pick(chartValueProp.value, rowIdDataItems), _.pick(childRecord, rowIdDataItems));
            });
            if (!childRecordChartProp) {
              let tempObj = _.cloneDeep(parentRecordChartProp);
              tempObj['value'] = _.pick(childRecord, rowIdDataItems);
              tempObj['color'] = chilRecordConfigColor || _this.reportColumnService.getColorColumnFunctionColor(child.value, rangeSet['value'], parentColor, parentLightColor, 6);
              //tempObj['color'] = _this.commonUtilsService.getGradientColor(parentColor, '#ffffff', partitionCount, indx + 1);
              currentChartPropsObj[propName].splice(parentPropIndex + indx + 1, 0, tempObj);
            } else {
              childRecordChartProp.color = chilRecordConfigColor || _this.reportColumnService.getColorColumnFunctionColor(child.value, rangeSet['value'], parentColor, parentLightColor, 6);
              // childRecordChartProp.color = _this.commonUtilsService.getGradientColor(parentColor, '#ffffff', partitionCount, indx + 1);
            }
          });
        });
      }
    }
  }

  ChartPropertiesService.prototype.getParentAttributeColor = function (currentChartPropsObj, data, record, recordIndex, attributes, parentLevel, colorInfoObj, value) {
    let _this = this;
    let color = '';
    var attributeNames = _.map(attributes, 'name');
    var chartProps = currentChartPropsObj;
    var idDataItems = _.map(_this.getMultipleDataItems(attributeNames).idDataItems, function (x) {
      return x.name;
    });
    let parentIndex;
    var parentRecord = _.find(data, function (item, index) {
      if (item['level'] === parentLevel && _.isEqual(_.pick(item, idDataItems), _.pick(record, idDataItems))) {
        parentIndex = index + '_';
        return true;
      }
    });
    var colIdDataItemNames = _this.getDataItemNames(ReportFormatDimensionsEnum.Columns);
    var colVal = _this.commonUtilsService.getConcatenatedValues(value, colIdDataItemNames, '_');
    if (_.has(colorInfoObj, parentIndex)) {
      colorInfoObj[parentIndex].children.push({
        childIndex: recordIndex,
        value: colVal ? record[colVal] : 0
      });
    } else {
      var propName = _this.getValuePropertyName();
      var rowIdItemNames = _this.currentVisual.chartType === ChartTypesEnum.BubbleChart && currentChartPropsObj.attributeName ? _.map(_this.getDataItems(currentChartPropsObj.attributeName).idDataItems, function (x) {
        return x.name
      }) : _this.getDataItemNames(ReportFormatDimensionsEnum.Rows);
      var parentChartProp = _.find(currentChartPropsObj[propName], function (chartProp) {
        return _.isEqual(_.pick(chartProp.value, rowIdItemNames), _.pick(parentRecord, rowIdItemNames))
      });
      colorInfoObj[parentIndex] = {
        children: [{
          childIndex: recordIndex,
          value: colVal ? record[colVal] : 0
        }],
        parentValue: colVal ? parentRecord[colVal] : 0
      };
    }
  }

  return ChartPropertiesService;
}());

exports.ChartPropertiesService = ChartPropertiesService;