import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import { appEvents } from 'app/core/core';
import kbn from 'app/core/utils/kbn';
import TimeSeries from 'app/core/time_series';
import rendering from './rendering';
import legend from './legend';
import moment from 'moment';

export class PieChartCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $rootScope, variableSrv) {
    super($scope, $injector);
    this.$rootScope = $rootScope;
    this.variableSrv = variableSrv;
    this.variableNames = _.map(variableSrv.variables, 'name');
    this.selectedSeries = {};
    this.timeBuckets = undefined;
    this.focusedTime = undefined;
    this.focusedBucketIndex = undefined;

    var panelDefaults = {
      pieType: 'pie',
      legend: {
        show: true, // disable/enable legend
        values: true
      },
      tooltip: {
        show: true
      },
      links: [],
      datasource: null,
      maxDataPoints: 3,
      interval: null,
      targets: [{}],
      cacheTimeout: null,
      nullPointMode: 'connected',
      legendType: 'Under graph',
      aliasColors: {},
      format: 'short',
      valueName: 'current',
      strokeWidth: 1,
      fontSize: '80%',
      combine: {
        threshold: 0.0,
        label: 'Others'
      }
    };

    _.defaults(this.panel, panelDefaults);
    _.defaults(this.panel.legend, panelDefaults.legend);

    this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));

    appEvents.on('graph-hover', this.onGraphHover.bind(this));
  }

  onGraphHover(event) {
    const pos = event.pos;
    const date = moment.utc(pos.x1);
    this.focusedTime = date.unix();
    const index = _.findLastIndex(this.timeBuckets, t=>(t <= this.focusedTime) );
    if (this.focusedBucketIndex != index) {
      this.render();
    }
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/grafana-piechart-panel/editor.html', 2);
    this.unitFormats = kbn.getUnitFormats();
  }

  setUnitFormat(subItem) {
    this.panel.format = subItem.value;
    this.render();
  }

  onDataError() {
    this.series = [];
    this.render();
  }

  changeSeriesColor(series, color) {
    series.color = color;
    this.panel.aliasColors[series.alias] = series.color;
    this.render();
  }

  onRender() {
    this.data = this.parseSeries(this.series);

    if (this.panel.clickAction === 'Update variable') {
      this.selectedSeries = {};

      const variable = _.find(this.variableSrv.variables, {'name': this.panel.variableToUpdate});
      const selected = _.map(_.filter(variable.options, {'selected': true}), 'value');
      if (selected.constructor === Array) {
        if (selected[0] === '$__all') {
          // do nothing
        } else {
          for (let i = 0; i < selected.length; i++) {
            this.selectedSeries[selected[i]] = true;
          }
        }
      }
    }
  }

  seriesData(serie) {
    let data;
    if (this.panel.valueName != 'time') {
      data = serie.stats[this.panel.valueName]
    } else {
      data = serie.flotpairs[this.focusedBucketIndex][1];
    }
    return data;
  }

  parseSeries(series) {
    if (series && series.length > 0) {
      this.timeBuckets = _.map(
        series[0].flotpairs,
        arr=>moment.utc(arr[0]).unix()
      );

      let index = _.findLastIndex(this.timeBuckets, t=>(t <= this.focusedTime) );
      if (index < 0) {
        index = 0;
      }
      if (index >= this.timeBuckets.length) {
        index = this.timeBuckets.length - 1;
      }
      this.focusedBucketIndex = index;
    }

    return _.map(series, (serie, i) => {
      return {
        label: serie.alias,
        data: this.seriesData(serie),
        color: this.panel.aliasColors[serie.alias] || this.$rootScope.colors[i]
      };
    });
  }

  onDataReceived(dataList) {
    this.series = dataList.map(this.seriesHandler.bind(this));
    this.data = this.parseSeries(this.series);
    this.render(this.data);
  }

  seriesHandler(seriesData) {
    var series = new TimeSeries({
      datapoints: seriesData.datapoints,
      alias: seriesData.target
    });

    series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
    return series;
  }

  getDecimalsForValue(value) {
    if (_.isNumber(this.panel.decimals)) {
      return { decimals: this.panel.decimals, scaledDecimals: null };
    }

    var delta = value / 2;
    var dec = -Math.floor(Math.log(delta) / Math.LN10);

    var magn = Math.pow(10, -dec);
    var norm = delta / magn; // norm is between 1.0 and 10.0
    var size;

    if (norm < 1.5) {
      size = 1;
    } else if (norm < 3) {
      size = 2;
      // special case for 2.5, requires an extra decimal
      if (norm > 2.25) {
        size = 2.5;
        ++dec;
      }
    } else if (norm < 7.5) {
      size = 5;
    } else {
      size = 10;
    }

    size *= magn;

    // reduce starting decimals if not needed
    if (Math.floor(value) === value) { dec = 0; }

    var result = {};
    result.decimals = Math.max(0, dec);
    result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

    return result;
  }

  formatValue(value) {
    var decimalInfo = this.getDecimalsForValue(value);
    var formatFunc = kbn.valueFormats[this.panel.format];
    if (formatFunc) {
      return formatFunc(value, decimalInfo.decimals, decimalInfo.scaledDecimals);
    }
    return value;
  }

  link(scope, elem, attrs, ctrl) {
    rendering(scope, elem, attrs, ctrl);
  }

  toggleSeries(serie) {
    if (this.selectedSeries[serie.label]) {
      delete this.selectedSeries[serie.alias];
    } else {
      this.selectedSeries[serie.label] = true;
    }
  }

  toggleCombinedSeries(combined) {
    for (var i = 0; i < combined.length; i++) {
      this.toggleSeries(combined[i]);
    }

    if (this.selectedSeries[this.panel.combine.label]) {
      delete this.selectedSeries[this.panel.combine.label];
    } else {
      this.selectedSeries[this.panel.combine.label] = true;
    }
  }

  updateVariable() {
    if (this.panel.variableToUpdate) {
      var selectedSeries = _.keys(this.selectedSeries);

      const variable = _.find(this.variableSrv.variables, {"name": this.panel.variableToUpdate});
      variable.current.text = selectedSeries.join(' + ');
      variable.current.value = selectedSeries;

      this.variableSrv.updateOptions(variable).then(() => {
        this.variableSrv.variableUpdated(variable).then(() => {
          this.$scope.$emit('template-variable-value-updated');
          this.$scope.$root.$broadcast('refresh');
        });
      });
    }
  }
}

PieChartCtrl.templateUrl = 'module.html';
