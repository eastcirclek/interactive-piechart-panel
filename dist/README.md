# Pie chart for Grafana 

A Grafana pie chart panel plugin based on [grafana/piechart-panel](https://github.com/grafana/piechart-panel). with additional functionality. It focuses on interacting with other Grafana panels via template variables and events. 

## Update template variable

You can choose what to do when you click on a slice in the pie chart or an entry in the legend. If you choose to update a template variable, you need to choose which variable to update.

![Piechart - Update variable - Options](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/img/piechart-update-variable-options.png)

When you click on a slice, it adds the label of the slice to the list of selected values of a template variable; if the slice is already in the list, it removes the label from the list. The same thing happens when you click on an entry in the legend.
![Piechart - Update variable](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/img/piechart-update-variable.gif)

## Update pie chart on graph-hover events from other panels

![Piechart - Update pie chart - Metrics](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/img/piechart-update-variable-metrics.png)

Consider you group your time series by tag and do not specify an aggregate function for each group. [grafana/piechart-panel](https://github.com/grafana/piechart-panel) provides some options to aggregate values of each tag group on Grafana: min, max, avg, current (last), and total. 

![Piechart - Update pie chart - Options](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/img/piechart-update-piechart-options.png)

[eastcirclek/piechart-panel](https://github.com/eastcirclek/piechart-panel) allows users to draw a pie chart using a set of values for a specific time. It assumes that the time information comes from time-series panels like the default graph panel.

![Piechart - Update pie chart - Options](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/img/piechart-update-piechart.gif)
 
To prevent this panel from loading large data to your browser, you'd better specify grouping time as well as shown below:

![Piechart - Update pie chart - Metrics](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/img/piechart-update-variable-metrics2.png)

Then you'll have less frequent updates on pie chart.

![Piechart - Update pie chart - Options](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/img/piechart-update-piechart2.gif)
 