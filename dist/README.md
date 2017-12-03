# Pie chart 

A Grafana pie chart panel plugin based on [grafana/piechart-panel](https://github.com/grafana/piechart-panel) with additional functionality:

## Update template variable

You can choose what to do when you click on a slice in the pie chart or an entry in the legend. If you choose to update a template variable, you need to choose which variable to update.
![Piechart - update variable option](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/src/img/piechart-update-variable-options.png)

When you click a slice, it adds the label of the slice to the list of selected values of a template variable. The same thing happens when you click an entry in the legend.  
![Piechart - update variable example](https://raw.githubusercontent.com/eastcirclek/piechart-panel/master/dist/src/img/piechart-update-variable.gif)
