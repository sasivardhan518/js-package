"use strict";
let _ = require('lodash');
let ChartTypesEnum = require('./chart-types-enum').ChartTypesEnum;
var MarkerTypesEnum = require('./marker-types-enum').MarkerTypes;
var chartElementsDefaultsMapping = require('./chart-elements-defaults-mapping-service').ChartElementsDefaultsMapping;
let ChartPropertiesDefaults = (function () {

  function ChartPropertiesDefaults() {
    this.test = null;
    console.log(chartElementsDefaultsMapping);
  }

  let serialChartDefaults = {
    colorType: null,
    format: "Flat",
    interBarWidth: "default",
    intraBarWidth: "default",
    isAutoColor: true,
    color: '#0099ff'
  };

  let barChartDefaults = _.extend({
    columnProperties: [{
      value: null,
      color: null,
      precision: 'auto'
    }],
    value: null
  }, serialChartDefaults);

  let multiColumnChartDefaults = {
    isDataLabelEnabled: true,
    isDisabled: false
  };

  let multiAxisChartsDefaults = {
    axis: "Y1",
    isDisabled: false,
    lineThickness: "default",
    lineType: "Solid",
    markerShape: "Diamond",
    color: null,
    value: null,
    precision: 'auto',
    fillAlpha: "default",
    isDataLabelEnabled: true
  };

  let comboChartDefaults = _.extend({
    orientation: "vertical",
    showExtremeLabels: false,
    isAllSelected: true,
    formatKey: null,
    columnProperties: [_.extend({
      chartType: "clusteredChart",
    }, multiAxisChartsDefaults)]
  }, serialChartDefaults);

  let lineChartDefaults = {
    colorType: null,
    isAutoColor: true,
    showExtremeLabels: false,
    isAllSelected: true,
    formatKey: null,
    columnProperties: [multiAxisChartsDefaults]
  };

  let areaChartDefaults = {
    colorType: null,
    isAutoColor: true,
    showExtremeLabels: false,
    isAllSelected: true,
    formatKey: null,
    columnProperties: [multiAxisChartsDefaults]
  };

  let pieFunnelCommonProps = {
    value: null,
    sliceCount: 6,
    threeDAngle: 10,
    displayValueType: "Percentage",
    colorType: null,
    isAutoColor: true,
    isDefaultSort: true,
    othersText: "OTHERS",
    rowProperties: [{
      value: null,
      color: null
    }]
  };
  let pieChartDefaults = _.extend({
    pieType: "pieChart",
    format: "Flat"
  }, pieFunnelCommonProps);

  let funnelChartDefaults = _.extend({
    funnelType: "pyramid"
  }, pieFunnelCommonProps);

  let xyChartDefaults = {
    attribValueProperties: [{
      value: null,
      shape: "Circle",
      color: null,
      size: 5
    }],
    attributeName: null,
    colorType: null,
    isAutoColor: true,
    xValue: null,
    yValue: null,
  };

  let bubbleChartDefaults = _.extend({
    bubbleValue: null,
    min: 1,
    max: 8
  }, xyChartDefaults);

  let gaugeChartDefaults = {
    needleColor: "#000000",
    sourceValue: null,
    targetValue: null,
    sourceValueColor: "#ff0000",
    targetValueColor: "#00ff00",
    isCustomTarget: false,
    customTargetValue: null,
    displayValueType: "Both",
  };

  let tileChartDefaults = {
    valuesToDisplay: [],
    tilesToDisplay: [],
    isAllSelected: true,
    formatKey: null,
    tileOptions: {
      precision: null,
      tileBackgroundColor: "#FFFFFF",
      tileBorderColor: "#D9D9D9",
      titleColor: "#333",
      titleFontSize: "Auto",
      colCount: null,
      rowCount: null,
      titleFontStyle: {
        bold: false,
        italic: false,
        underline: false
      }
    },
    columnValues: [{
      baseColor: "#ff0000",
      comparedColumn: null,
      comparedValue: 0,
      conditionColor: "#78AB49",
      conditionOperator: 3,
      customDescription: "",
      defaultScaleInfo: "M",
      displayUnits: "Auto",
      fontColor: "#333",
      fontSize: "Auto",
      fontType: null,
      invert: false,
      isComparedToNumber: true,
      isDisabled: false,
      precision: 'auto',
      symbol: "Triangle",
      symbolSize: "Auto",
      value: null
    }]
  };

  let treeChartDefaults = {
    colorType: null,
    isAutoColor: true,
    rowProperties: [{
      value: null,
      color: null
    }],
    value: null
  };

  let yearOnYearChartDefaults = {
    colorType: null,
    columnProperties: [{
      color: null,
      lineThickness: "default",
      lineType: "Solid",
      markerShape: "Diamond",
      value: null,
      isDataLabelEnabled: true
    }],
    isAutoColor: true,
    value: null
  };

  let bridgeChartDefaults = {
    sortOrder: "none",
    sourceValue: null,
    targetValue: null,
    othersText: "OTHERS",
    positiveColor: '#008000',
    negativeColor: '#ff0000'
  };

  let mapChartDefaults = {
    isAutoColor: true,
    colorType: null,
    rowValues: [{
      value: null,
      color: null
    }],
    color: '#CDDBED',
    colorAttributes: [],
    markerProperties: [{
      value: null,
      isDisabled: true,
      sizeColumn: null,
      markerType: null,
      isStaticSize: false,
      staticSize: null,
      markerColorType: null,
      isLabelEnabled: false,
      color: null,
      isDataLabelEnabled: false,
      dataLabelColumns: [],
      maxSize: 15,
      minSize: 5
    }],
    isColumnProperties: false,
    gradient: {
      maxValueColor: '#7ED321',
      minValueColor: '#D0021B',
      value: null,
      minValue: null,
      maxValue: null,
    },
    zoomLevel: null,
    dsfColumn: null,
    bounds: null,
    formatKey: null
  }



  let wordChartDefaults = {

  };

  let gridChartDefaults = {

  };

  let targetChartDefaults = {
    sourceValue: null,
    targetValue: null,
    isAbsoluteValue: false
  }


  ChartPropertiesDefaults.prototype.getDefaultsBasedOnChartType = function (chartType, currentChartProps) {
    let defaults = {};
    switch (chartType) {
      case ChartTypesEnum.BarChart:
      case ChartTypesEnum.ColumnChart:
        defaults = barChartDefaults;
        break;
      case ChartTypesEnum.StackColumnChart:
      case ChartTypesEnum.StackBarChart:
      case ChartTypesEnum.ClusteredBarChart:
      case ChartTypesEnum.ClusteredColumnChart:
        let columnProperty = _.extend({}, barChartDefaults.columnProperties[0], multiColumnChartDefaults);
        defaults = _.cloneDeep(barChartDefaults);
        defaults.isAllSelected = true;
        defaults.formatKey = null;
        defaults.columnProperties = [columnProperty];
        break;
      case ChartTypesEnum.ComboChart:
        defaults = comboChartDefaults;
        break;
      case ChartTypesEnum.LineChart:
      case ChartTypesEnum.StackLineChart:
        defaults = lineChartDefaults;
        break;
      case ChartTypesEnum.AreaChart:
      case ChartTypesEnum.StackAreaChart:
        defaults = areaChartDefaults;
        break;
      case ChartTypesEnum.PieChart:
        defaults = pieChartDefaults;
        break;
      case ChartTypesEnum.FunnelChart:
        defaults = funnelChartDefaults;
        break;
      case ChartTypesEnum.ScatterChart:
        defaults = xyChartDefaults;
        break;
      case ChartTypesEnum.BubbleChart:
        defaults = bubbleChartDefaults;
        break;
      case ChartTypesEnum.GaugeChart:
        defaults = gaugeChartDefaults;
        break;
      case ChartTypesEnum.HorizontalBridgeChart:
      case ChartTypesEnum.VerticalBridgeChart:
        defaults = bridgeChartDefaults;
        break;
      case ChartTypesEnum.TreeChart:
        defaults = treeChartDefaults;
        break;
      case ChartTypesEnum.TileChart:
        defaults = tileChartDefaults;
        break;
      case ChartTypesEnum.YearOnYearChart:
        defaults = yearOnYearChartDefaults;
        break;
      case ChartTypesEnum.HorizontalTargetChart:
      case ChartTypesEnum.VerticalTargetChart:
        defaults = targetChartDefaults;
        break;
      case ChartTypesEnum.Map:
        defaults = mapChartDefaults;
        break;
    }
    return _.cloneDeep(defaults);
  }

  return ChartPropertiesDefaults;

}());

exports.ChartPropertiesDefaults = ChartPropertiesDefaults;