let moment = require('moment');

var defaults = {
    highestStringValue: '~~~~~',
    lowestStringValue: '      ',
    MaxDateValue: moment(new Date()).add(100, 'years')+0  ,
    MinDateValue: moment(new Date()).subtract(100, 'years')+0,
    partitionCount: 5,
    colorConditionsEnum: {
        color: 'color',
        showHide: 'showHide'
    },
    defaultNameProperty: '_desc',
    dataItemsEnum: {
        idDataItems: 'idDataItems',
        displayDataItems: 'displayDataItems',
        sortDataItems: 'sortDataItems'
    },
    labelTypes: {
        groupLabel: 2,
        propertyLabel: 4
    },
    colors: [
    "#00ACDD",
    "#8FC620",
    "#FF8C00",
    "#FFDC00",
    "#D64B3F",
    "#9665BD",
    "#0078D7",
    "#4BBF30",
    "#063A5D",
    "#CC0033",
    "#9C4506",
    "#0F7C0F",
    "#BAB0AC",
    "#5E3498"
    ]
}

exports.defaults = defaults;