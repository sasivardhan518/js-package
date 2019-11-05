"use strict"
var ChartGroupsEnum = require('./chart-groups-enum').ChartGroupsEnum;
var groups = {};
groups[ChartGroupsEnum.General] = {
    "chartBackgroundColor": {
        "defaultValue": 'colorPicker',
    },
    "topPadding": {
        "defaultValue": 20,
    },
    "rightPadding": {
        "defaultValue": 20,
    },
    "bottomPadding": {
        "defaultValue": 20,
    },
    "leftPadding": {
        "defaultValue": 20,
    },
    "precision": {
        "defaultValue": 2,
        "excel": {
            "mappingKey": 'formatCodePrecision',
        }
    },
    "colorPicker": {
        "excel": {
            "mappingKey": 'colorPicker',
        }
    },
    "gradientColorPicker": {
        "defaultValue": {
            color1: "#DBA5D2",
            color2: "#0000FF"
        },
        "excel": {
            "mappingKey": 'gradientColorPicker',
        }
    }
};
groups[ChartGroupsEnum.XAxisLabelsColor] = {
    "toggleXAxisLabels": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'showCatAxisLabel',
        }
    },
    "xAxisLabelTextColor": {
        "defaultValue": '#000000',
        "excel": {
            "mappingKey": 'catAxisLabelColor',
        }
    }
};
groups[ChartGroupsEnum.XAxisLabelsFont] = {
    "xAxisLabelFontSize": {
        "defaultValue": 10,
        "excel": {
            "mappingKey": 'catAxisLabelFontSize',
        }
    },
    "xAxisLabelTextFormat": {
        "defaultValue": {
            bold: false,
            italic: false,
            underline: false
        },
        "excel": {
            "mappingKey": 'catAxisLabelTextFormat',
        }
    }
};
groups[ChartGroupsEnum.XAxisLabelsPlacement] = {
    "xAxisLabelsPosition": {
        "defaultValue": false,
    },
    "xAxisLablesRotation": {
        "defaultValue": null,
        "excel": {
            "mappingKey": 'catAxisRotate',
        }
    },
    "xAxisLablesInterval": {
        "defaultValue": null,
        "excel": {
            "mappingKey": 'catAxisLabelFrequency',
        }
    }
};
groups[ChartGroupsEnum.XAxisBubbleLabelsPlacement] = {
    "xAxisLabelsPosition": {
        "defaultValue": false,
    },
    "xAxisLablesRotation": {
        "defaultValue": 0,
        "excel": {
            "mappingKey": 'catAxisRotate',
        }
    }
};
groups[ChartGroupsEnum.XAxisTitle] = {
    "toggleXAxisTitle": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'showCatAxisTitle',
        }
    },
    "xAxisTitle": {
        "defaultValue": '',
        "excel": {
            "mappingKey": 'catAxisTitle',
        }
    },
    "xAxisTitleColor": {
        "defaultValue": '#000000',
        "excel": {
            "mappingKey": 'catAxisTitleColor',
        }
    },
    "xAxisTitleFontSize": {
        "defaultValue": 12,
        "excel": {
            "mappingKey": 'catAxisTitleFontSize',
        }
    },
    "xAxisTextFormat": {
        "defaultValue": {
            bold: true,
            italic: false,
            underline: false
        },
        "excel": {
            "mappingKey": 'catAxisTitleTextFormat',
        }
    },
    "xAxisTitlePosition": {
        "defaultValue": 'center',
    },
    "xAxisTitleOrientation": {
        "defaultValue": 0,
    },
    "xAxisTitleHeight": {
        "defaultValue": null,
    },
    "xAxisTitleStroke": {
        "defaultValue": '#ffffff',
        "excel": {
            "mappingKey": 'catAxisTitleBorderColor',
        }
    },
    "xAxisTitleBackGroundColor": {
        "defaultValue": 'rgba(0, 0, 0, 0)',
        "excel": {
            "defaultValue": null,
            "mappingKey": 'catAxisTitleBackGroundColor',
        }
    }
};
groups[ChartGroupsEnum.XAxis] = {
    "toggleXAxis": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'catAxisLineShow',
        }
    },
    "xAxisPosition": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'catAxisLabelPos',
        }
    },
    "xAxisReverseOrder": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'catAxisOrientation',
        }
    },
    "xAxisColor": {
        "defaultValue": '#000000',
        "excel": {
            "mappingKey": 'catAxisLineColor',
        }
    }
};
groups[ChartGroupsEnum.XValueAxis] = {
    "toggleXAxis": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'catAxisLineShow',
        }
    },
    "xAxisPosition": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'catAxisLabelPos',
        }
    },
    "xAxisReverseOrder": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'catAxisOrientation',
        }
    },
    "xAxisColor": {
        "defaultValue": '#000000',
        "excel": {
            "mappingKey": 'catAxisLineColor',
        }
    },
    "xAxisMinimumValue": {
        "defaultValue": null,
    },
    "xAxisMaximumValue": {
        "defaultValue": null,
    }
};
groups[ChartGroupsEnum.YAxis] = {
    "toggleYAxis": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'valAxisLineShow',
        }
    },
    "yAxisPosition": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'valAxisLabelPos',
        }
    },
    "yAxisReverseOrder": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'valAxisOrientation',
        }
    },
    "yAxisColor": {
        "defaultValue": "000000",
        "excel": {
            "mappingKey": 'valAxisLineColor'
        }
    }
};
groups[ChartGroupsEnum.YAxisDataModifier] = {
    "scaling": {
        "defaultValue": 'default',
        "excel": {
            "mappingKey": 'formatCodeScaling',
        }
    },
    "yAxisMinimumValue": {
        "defaultValue": null,
        "excel": {
            "mappingKey": 'valAxisMinVal',
        }
    },
    "yAxisMaximumValue": {
        "defaultValue": null,
        "excel": {
            "mappingKey": 'valAxisMaxVal',
        }
    },
    "toggleYAxisLogScale": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'showValAxisLogScale',
        }
    }
};
groups[ChartGroupsEnum.YAxisLabelsColor] = {
    "toggleYAxisLabels": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'showValAxisLabel',
        }
    },
    "yAxisLabelTextColor": {
        "defaultValue": '#000000',
        "excel": {
            "mappingKey": 'valAxisLabelColor',
        }
    }
};
groups[ChartGroupsEnum.YAxisTitle] = {
    "toggleYAxisTitle": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'showValAxisTitle',
        }
    },
    "yAxisTitle": {
        "defaultValue": '',
        "excel": {
            "mappingKey": 'valAxisTitle',
        }
    },
    "yAxisTitleColor": {
        "defaultValue": '#000000',
        "excel": {
            "mappingKey": 'valAxisTitleColor',
        }
    },
    "yAxisTitleFontSize": {
        "defaultValue": 12,
        "excel": {
            "mappingKey": 'valAxisTitleFontSize',
        }
    },
    "yAxisTextFormat": {
        "defaultValue": {
            bold: true,
            italic: false,
            underline: false
        },
        "excel": {
            "mappingKey": 'valAxisTitleTextFormat',
        }
    },
    "yAxisTitlePosition": {
        "defaultValue": 'middle',
    },
    "yAxisTitleOrientation": {
        "defaultValue": 270,
    },
    "yAxisTitleHeight": {
        "defaultValue": null,
    },
    "yAxisTitleStroke": {
        "defaultValue": '#ffffff',
        "excel": {
            "defaultValue": null,
            "mappingKey": 'valAxisTitleBorderColor',
        }
    },
    "yAxisTitleBackGroundColor": {
        "defaultValue": 'rgba(0, 0, 0, 0)',
        "excel": {
            "defaultValue": null,
            "mappingKey": 'valAxisTitleBackGroundColor',
        }
    }
};
groups[ChartGroupsEnum.YAxisLabelsPlacement] = {
    "yAxisLabelsPosition": {
        "defaultValue": false,
    },
    "yAxisLablesRotation": {
        "defaultValue": 0,
        "excel": {
            "mappingKey": 'valAxisRotate',
        }
    }
};
groups[ChartGroupsEnum.YAxisLabelsFont] = {
    "yAxislabelsFontSize": {
        "defaultValue": 10,
        "excel": {
            "mappingKey": 'valAxisLabelFontSize',
        }
    },
    "yAxisLabelTextFormat": {
        "defaultValue": {
            bold: false,
            italic: false,
            underline: false
        },
        "excel": {
            "mappingKey": 'valAxisLabelTextFormat',
        }
    }
};
groups[ChartGroupsEnum.Y2Axis] = {
    "toggleY2Axis": {
        "defaultValue": false,
    },
    "y2AxisPosition": {
        "defaultValue": false,
    },
    "y2AxisReverseOrder": {
        "defaultValue": false,
    },
    "y2AxisColor": {
        "defaultValue": "000000"
    }
};
groups[ChartGroupsEnum.Y2AxisDataModifier] = {
    "y2Scaling": {
        "defaultValue": 'default',
    },
    "y2AxisMinimumValue": {
        "defaultValue": null,
    },
    "y2AxisMaximumValue": {
        "defaultValue": null,
    },
    "toggleY2AxisLogScale": {
        "defaultValue": false,
    }
};
groups[ChartGroupsEnum.Y2AxisLabelsColor] = {
    "toggleY2AxisLabels": {
        "defaultValue": false,
    },
    "y2AxisLabelTextColor": {
        "defaultValue": '#000000',
    }
};
groups[ChartGroupsEnum.Y2AxisTitle] = {
    "toggleY2AxisTitle": {
        "defaultValue": false,
    },
    "y2AxisTitle": {
        "defaultValue": '',
    },
    "y2AxisTitleColor": {
        "defaultValue": '#000000',
    },
    "y2AxisTitleFontSize": {
        "defaultValue": 12,
    },
    "y2AxisTextFormat": {
        "defaultValue": {
            bold: true,
            italic: false,
            underline: false
        },
    },
    "y2AxisTitlePosition": {
        "defaultValue": 'middle',
    },
    "y2AxisTitleOrientation": {
        "defaultValue": 270,
    },
    "y2AxisTitleHeight": {
        "defaultValue": null,
    },
    "y2AxisTitleStroke": {
        "defaultValue": '#ffffff',
    },
    "y2AxisTitleBackGroundColor": {
        "defaultValue": 'rgba(0,0,0,0)',
        "excel": {
            "defaultValue": null
        }
    }
};
groups[ChartGroupsEnum.Y2AxisLabelsPlacement] = {
    "y2AxisLabelsPosition": {
        "defaultValue": false,
    },
    "y2AxisLablesRotation": {
        "defaultValue": 0,
    }
};
groups[ChartGroupsEnum.Y2AxisLabelsFont] = {
    "y2AxislabelsFontSize": {
        "defaultValue": 10,
    },
    "y2AxisLabelTextFormat": {
        "defaultValue": {
            bold: false,
            italic: false,
            underline: false
        },
    }
};
groups[ChartGroupsEnum.DataLabels] = {
    "toggleDataLabel": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'showDataLabel',
        }
    },
    "dataLabelTextColor": {
        "defaultValue": '#000000',
        "excel": {
            "mappingKey": 'dataLabelColor',
        }
    },
    "dataLabelFontSize": {
        "defaultValue": 10,
        "excel": {
            "mappingKey": 'dataLabelFontSize',
        }
    },
    "dataLabelTextFormat": {
        "defaultValue": {
            bold: false,
            italic: false,
            underline: false
        },
        "excel": {
            "mappingKey": 'dataLabelTextFormat',
        }
    },
    "dataLabelPosition": {
        "defaultValue": 0,
        "excel": {
            "mappingKey": 'dataLabelPosition',
        }
    },
    "dataLabelRotation": {
        "defaultValue": null,
        "excel": {
            "mappingKey": 'dataLabelRotate',
        }
    },
    "dataLabelBackGroundColor": {
        "defaultValue": 'rgba(0,0,0,0)',
        "excel": {
            "defaultValue": null,
            "mappingKey": 'dataLabelBackGroundColor',
        }
    }
};
groups[ChartGroupsEnum.DataPoints] = {};
groups[ChartGroupsEnum.Titles] = {
    "toggleChartTitle": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'showTitle',
        }
    },
    "chartTitle": {
        "defaultValue": '',
        "excel": {
            "mappingKey": 'title',
        }
    },
    "chartTitleColor": {
        "defaultValue": '#000000',
        "excel": {
            "mappingKey": 'titleColor',
        }
    },
    "chartTitleFontSize": {
        "defaultValue": 18,
        "excel": {
            "mappingKey": 'titleFontSize',
        }
    },
    "chartTitleTextFormat": {
        "defaultValue": {
            bold: true,
            italic: false,
            underline: false
        },
        "excel": {
            "mappingKey": 'titleTextFormat',
        }
    },
    "chartTitlePosition": {
        "defaultValue": 'center',
        "excel": {
            "mappingKey": 'titleAlign',
        }
    },
    "chartTitleOrientation": {
        "defaultValue": 0,
        "excel": {
            "mappingKey": 'titleRotate',
        }
    },
    "chartTitleHeight": {
        "defaultValue": 'Auto',
    },
    "chartTitleStroke": {
        "defaultValue": '#ffffff',
        "excel": {
            "mappingKey": 'titleBorderColor',
        }
    },
    "chartTitleBackGroundColor": {
        "defaultValue": '#ffffff',
        "excel": {
            "mappingKey": "titleBackGroundColor"
        }
    }
};
groups[ChartGroupsEnum.Legends] = {
    "toggleLegends": {
        "defaultValue": false,
        "excel": {
            "mappingKey": 'showLegend',
        }
    },
    "legendsFontSize": {
        "defaultValue": 10,
        "excel": {
            "mappingKey": 'legendFontSize',
        }
    },
    "legendsPosition": {
        "defaultValue": 'bottom',
        "excel": {
            "mappingKey": 'legendPos',
        }
    },
    "legendsBoxSize": {
        "defaultValue": 12,
        "excel": {
            "mappingKey": 'legendsBoxSize',
        }
    }
};
groups[ChartGroupsEnum.TileSectionSettings] = {
    "IsHidden": {
        "defaultValue": false,
    },
    "descriptionFontSize": {
        "defaultValue": 12,
    },
    "valueFontSize": {
        "defaultValue": 12,
    },
    "descriptionColor": {
        "defaultValue": '#000000',
    },
    "valueColor": {
        "defaultValue": '#000000',
    },
    "symbolFontSize": {
        "defaultValue": 12,
    }
};
groups[ChartGroupsEnum.DisplayUnits] = {
    "scaling": {
        "defaultValue": 'default',
        "excel": {
            "mappingKey": 'formatCodeScaling',
        }
    }
};

var ChartElementsDefaults = {
    groups: groups,
    serialChartsCollection: [
        ChartGroupsEnum.General,
        ChartGroupsEnum.XAxisLabelsColor,
        ChartGroupsEnum.XAxisLabelsFont,
        ChartGroupsEnum.XAxisLabelsPlacement,
        ChartGroupsEnum.XAxisTitle,
        ChartGroupsEnum.XAxis,
        ChartGroupsEnum.YAxis,
        ChartGroupsEnum.YAxisDataModifier,
        ChartGroupsEnum.YAxisLabelsColor,
        ChartGroupsEnum.YAxisLabelsFont,
        ChartGroupsEnum.YAxisLabelsPlacement,
        ChartGroupsEnum.YAxisTitle,
        ChartGroupsEnum.Titles,
        ChartGroupsEnum.Legends,
        ChartGroupsEnum.DataLabels
    ],
    dualAxisSerialChartsCollection: [
        ChartGroupsEnum.General,
        ChartGroupsEnum.XAxisLabelsColor,
        ChartGroupsEnum.XAxisLabelsFont,
        ChartGroupsEnum.XAxisLabelsPlacement,
        ChartGroupsEnum.XAxisTitle,
        ChartGroupsEnum.XAxis,
        ChartGroupsEnum.YAxis,
        ChartGroupsEnum.YAxisDataModifier,
        ChartGroupsEnum.YAxisLabelsColor,
        ChartGroupsEnum.YAxisLabelsFont,
        ChartGroupsEnum.YAxisLabelsPlacement,
        ChartGroupsEnum.YAxisTitle,
        ChartGroupsEnum.Y2Axis,
        ChartGroupsEnum.Y2AxisDataModifier,
        ChartGroupsEnum.Y2AxisLabelsColor,
        ChartGroupsEnum.Y2AxisLabelsFont,
        ChartGroupsEnum.Y2AxisLabelsPlacement,
        ChartGroupsEnum.Y2AxisTitle,
        ChartGroupsEnum.Titles,
        ChartGroupsEnum.Legends,
        ChartGroupsEnum.DataLabels
    ],
    comboChartExcelProps: {
        "toggleYAxis": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisLineShow',
            }
        },
        "yAxisPosition": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisLabelPos',
            }
        },
        "scaling": {
            "excel": {
                "mappingKey": 'valAxes[0].formatCodeScaling',
            }
        },
        "yAxisMinimumValue": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisMinVal',
            }
        },
        "yAxisMaximumValue": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisMaxVal',
            }
        },
        "yAxisReverseOrder": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisOrientation',
            }
        },
        "toggleYAxisLogScale": {
            "excel": {
                "mappingKey": 'valAxes[0].showValAxisLogScale',
            }
        },
        "toggleYAxisLabels": {
            "excel": {
                "mappingKey": 'valAxes[0].showValAxisLabel',
            }
        },
        "yAxisLabelTextColor": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisLabelColor',
            }
        },
        "toggleYAxisTitle": {
            "excel": {
                "mappingKey": 'valAxes[0].showValAxisTitle',
            }
        },
        "yAxisTitle": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisTitle',
            }
        },
        "yAxisTitleColor": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisTitleColor',
            }
        },
        "yAxisTitleFontSize": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisTitleFontSize',
            }
        },
        "yAxisTextFormat": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisTitleTextFormat',
            }
        },
        "yAxisTitleStroke": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisTitleBorderColor',
            }
        },
        "yAxisTitleBackGroundColor": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisTitleBackGroundColor',
            }
        },
        "yAxisLablesRotation": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisRotate',
            }
        },
        "yAxisLabelFontSize": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisLabelFontSize',
            }
        },
        "yAxisLabelTextFormat": {
            "excel": {
                "mappingKey": 'valAxes[0].valAxisLabelTextFormat',
            }
        },
        "yAxisColor": {
            "defaultValue": "000000",
            "excel": {
                "mappingKey": 'valAxes[0].valAxisLineColor'
            }
        },
        "toggleY2Axis": {
            "excel": {
                "mappingKey": 'valAxes[1].showValAxisTitle',
            }
        },
        "y2AxisPosition": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisLabelPos',
            }
        },
        "y2Scaling": {
            "excel": {
                "mappingKey": 'valAxes[1].FormatCodeScaling',
            }
        },
        "y2AxisMinimumValue": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisMinVal',
            }
        },
        "y2AxisMaximumValue": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisMaxVal',
            }
        },
        "y2AxisReverseOrder": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisOrientation',
            }
        },
        "toggleY2AxisLogScale": {
            "excel": {
                "mappingKey": 'valAxes[1].showValAxisLogScale',
            }
        },
        "toggleY2AxisLabels": {
            "excel": {
                "mappingKey": 'valAxes[1].showValAxisLabel',
            }
        },
        "y2AxisLabelTextColor": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisLabelColor',
            }
        },
        "toggleY2AxisTitle": {
            "excel": {
                "mappingKey": 'valAxes[1].showValAxisTitle',
            }
        },
        "y2AxisTitle": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisTitle',
            }
        },
        "y2AxisTitleColor": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisTitleColor',
            }
        },
        "y2AxisTitleFontSize": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisTitleFontSize',
            }
        },
        "y2AxisTextFormat": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisTitleTextFormat',
            }
        },
        "y2AxisTitleStroke": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisTitleBorderColor',
            }
        },
        "y2AxisTitleBackGroundColor": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisTitleBackGroundColor',
            }
        },
        "y2AxisLabelFontSize": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisLabelFontSize',
            }
        },
        "y2AxisLabelTextFormat": {
            "excel": {
                "mappingKey": 'valAxes[1].valAxisLabelTextFormat',
            }
        },
        "y2AxisColor": {
            "defaultValue": "000000",
            "excel": {
                "mappingKey": 'valAxes[1].valAxisLineColor'
            }
        },

        "xAxisLabelTextColor": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisLabelColor',
            }
        },
        "xAxisLabelFontSize": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisLabelFontSize',
            }
        },
        "xAxisLabelTextFormat": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisLabelFontFace',
            }
        },
        "xAxisLablesRotation": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisRotate',
            }
        },
        "xAxisLablesInterval": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisLabelFrequency',
            }
        },
        "toggleXAxisTitle": {
            "excel": {
                "mappingKey": 'catAxes[0].showCatAxisTitle',
            }
        },
        "xAxisTitleColor": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisTitleColor',
            }
        },
        "xAxisTitleStroke": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisTitleBorderColor',
            }
        },
        "xAxisTitleBackGroundColor": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisTitleBackGroundColor',
            }
        },
        "xAxisPosition": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisLabelPos',
            }
        },
        "xAxisColor": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisLineColor',
            }
        },
        "xAxisReverseOrder": {
            "excel": {
                "mappingKey": 'catAxes[0].catAxisOrientation',
            }
        }

    }
}

exports.ChartElementsDefaults = ChartElementsDefaults;