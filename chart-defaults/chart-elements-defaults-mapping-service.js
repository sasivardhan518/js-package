var _ = require('lodash');
var ChartTypesEnum = require('./chart-types-enum').ChartTypesEnum;
var ChartGroupsEnum = require('./chart-groups-enum').ChartGroupsEnum;
var RequestType = require('./reuqest-type-enum').RequestType;
var ChartElementsDefaults = require('./chart-elements-defaults').ChartElementsDefaults;

var ChartElementsDefaultsMappingService = (function () {

    function ChartElementsDefaultsMappingService() {
        this.groups = ChartElementsDefaults.groups;
        this.serialChartsCollection = ChartElementsDefaults.serialChartsCollection;
        this.dualAxisSerialChartsCollection = ChartElementsDefaults.dualAxisSerialChartsCollection;
        this.comboChartExcelProps = ChartElementsDefaults.comboChartExcelProps;
    }

    ChartElementsDefaultsMappingService.prototype.getDefaultChartElements = function (chartType) {
        let defaultChartELements = {};
        let _this = this;
        switch (chartType) {
            case ChartTypesEnum.BarChart:
            case ChartTypesEnum.ColumnChart:
            case ChartTypesEnum.StackBarChart:
            case ChartTypesEnum.StackColumnChart:
            case ChartTypesEnum.ClusteredBarChart:
            case ChartTypesEnum.YearOnYearChart:
            case ChartTypesEnum.ClusteredColumnChart:
                defaultChartELements = _this.getChartElements(this.serialChartsCollection);
                break;
            case ChartTypesEnum.PieChart:
                defaultChartELements = _this.getChartElements([ChartGroupsEnum.Titles, ChartGroupsEnum.DataLabels, ChartGroupsEnum.General, ChartGroupsEnum.Legends, ChartGroupsEnum.DisplayUnits], null, null, {
                    'dataLabelFontSize': 12,
                    "toggleLegends": {
                        "excel": {
                            "defaultValue" :  true,
                            "mappingKey" : 'showLegend',
                        }
                    },
                });
                break;
            case ChartTypesEnum.FunnelChart:
                defaultChartELements = _this.getChartElements([ChartGroupsEnum.Titles, ChartGroupsEnum.DataLabels, ChartGroupsEnum.General, ChartGroupsEnum.Legends, ChartGroupsEnum.DisplayUnits]);
                break;
            case ChartTypesEnum.BubbleChart:
            case ChartTypesEnum.ScatterChart:
                let groupsToAdd = _this.getChartElements([ChartGroupsEnum.XValueAxis, ChartGroupsEnum.XAxisBubbleLabelsPlacement]);
                defaultChartELements = _this.getChartElements(this.serialChartsCollection, [ChartGroupsEnum.Legends, ChartGroupsEnum.XAxis, ChartGroupsEnum.XAxisLabelsPlacement], groupsToAdd);
                break;
            case ChartTypesEnum.HorizontalTargetChart:
            case ChartTypesEnum.VerticalTargetChart:
                defaultChartELements = _this.getChartElements([
                    ChartGroupsEnum.Titles,
                    ChartGroupsEnum.General,
                    ChartGroupsEnum.DisplayUnits,
                    ChartGroupsEnum.XAxisLabelsColor,
                    ChartGroupsEnum.XAxisLabelsFont,
                    ChartGroupsEnum.YAxisLabelsColor,
                    ChartGroupsEnum.YAxisLabelsFont,
                    ChartGroupsEnum.DataLabels
                ], ['dataLabelPosition', 'dataLabelRotation'], null, {
                    'topPadding': 5,
                    'rightPadding': 5,
                    'bottomPadding': 5,
                    'leftPadding': 5
                });
                break;
            case ChartTypesEnum.HorizontalBridgeChart:
            case ChartTypesEnum.VerticalBridgeChart:
                defaultChartELements = _this.getChartElements(this.serialChartsCollection, [ChartGroupsEnum.Legends]);
                break;
            case ChartTypesEnum.GaugeChart:
                defaultChartELements = _this.getChartElements([
                    ChartGroupsEnum.Titles,
                    ChartGroupsEnum.DataLabels,
                    ChartGroupsEnum.XAxisLabelsColor,
                    ChartGroupsEnum.XAxisLabelsFont,
                    ChartGroupsEnum.General,
                    ChartGroupsEnum.DisplayUnits
                ], ['toggleXAxisLabels', 'dataLabelPosition', 'dataLabelBackGroundColor'], {
                    'toggleDataLabel': false,
                    'dataLabelFontSize': 12,
                    'dataLabelTextFormat': {
                        bold: true,
                        italic: false,
                        underline: false
                    }
                });
                break;
            case ChartTypesEnum.LineChart:
            case ChartTypesEnum.AreaChart:
            case ChartTypesEnum.StackLineChart:
            case ChartTypesEnum.StackAreaChart:
                defaultChartELements = _this.getChartElements(this.dualAxisSerialChartsCollection);
                break;
            case ChartTypesEnum.ComboChart:
                defaultChartELements = _this.getChartElements(this.dualAxisSerialChartsCollection, null, null, this.comboChartExcelProps);
                break;
            case ChartTypesEnum.TileChart:
                defaultChartELements = _this.getChartElements([ChartGroupsEnum.Titles], null, null, {
                    'toggleChartTitle': true
                });
                break;
            case ChartTypesEnum.TreeChart:
                defaultChartELements = _this.getChartElements([
                    ChartGroupsEnum.Titles,
                    ChartGroupsEnum.DataLabels,
                    ChartGroupsEnum.General,
                    ChartGroupsEnum.Scaling
                ], ['dataLabelPosition', 'backgroundColor'], null, {
                    'toggleDataLabel': false
                });
                break;
        }
        return defaultChartELements;
    };

    ChartElementsDefaultsMappingService.prototype.getChartElements = function (groups, propsOrGroupsToRemove, propsToAdd, propsToUpdate) {
        let chartElements = {};
        let _this = this;
        _.forEach(groups, function (groupName) {
            if (_.indexOf(propsOrGroupsToRemove, groupName) === -1) {
                _.extend(chartElements, _.cloneDeep(_this.groups[groupName]));
            }
        });
        if (_.size(propsOrGroupsToRemove)) {
            chartElements = _.omit(chartElements, propsOrGroupsToRemove);
        }
        if (_.size(propsToAdd) || _.size(propsToUpdate)) {
            _.merge(chartElements, propsToAdd, propsToUpdate);
        }
        return chartElements;
    };

    ChartElementsDefaultsMappingService.prototype.getMergedChartElements = function (chartType, requestType, chartElementsObj) {
        let _this = this;
        let mergedChartElements = {};
        let chartTypeDefaultChartElements = _.cloneDeep(_this.getDefaultChartElements(chartType));
        _.forOwn(chartTypeDefaultChartElements, function (elementValue, elementKey) {
            _this.convertChartElements(mergedChartElements, elementKey, elementValue, requestType, chartElementsObj)
        });
        return mergedChartElements;
    };

    ChartElementsDefaultsMappingService.prototype.convertChartElements = function (finalObj, elementKey, elementObj, requestType, chartElementsObj) {
        let propsToRemove = [RequestType.Excel, RequestType.PPT];
        let requestTypeElement = _.cloneDeep(elementObj[requestType]);
        let defaultElement = _.cloneDeep(_.omit(elementObj, propsToRemove));
        let finalElement = _.merge(defaultElement, requestTypeElement);
        let key = finalElement.mappingKey || elementKey;
        if (!_.has(finalObj, key)) {
            finalObj[key] = _.isObject(finalElement.defaultValue) ? _.merge(finalElement.defaultValue, chartElementsObj && chartElementsObj[elementKey]) : (chartElementsObj && _.has(chartElementsObj, elementKey) ? chartElementsObj[elementKey] : finalElement.defaultValue);
        }
    };

    return ChartElementsDefaultsMappingService;
}());

exports.ChartElementsDefaultsMappingService = ChartElementsDefaultsMappingService;