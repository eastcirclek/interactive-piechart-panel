'use strict';

System.register(['app/plugins/sdk', 'lodash', 'app/core/core', 'app/core/utils/kbn', 'app/core/time_series', './rendering', './legend', 'moment'], function (_export, _context) {
  "use strict";

  var MetricsPanelCtrl, _, appEvents, kbn, TimeSeries, rendering, legend, moment, _createClass, PieChartCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreCore) {
      appEvents = _appCoreCore.appEvents;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_rendering) {
      rendering = _rendering.default;
    }, function (_legend) {
      legend = _legend.default;
    }, function (_moment) {
      moment = _moment.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('PieChartCtrl', PieChartCtrl = function (_MetricsPanelCtrl) {
        _inherits(PieChartCtrl, _MetricsPanelCtrl);

        function PieChartCtrl($scope, $injector, $rootScope, variableSrv) {
          _classCallCheck(this, PieChartCtrl);

          var _this = _possibleConstructorReturn(this, (PieChartCtrl.__proto__ || Object.getPrototypeOf(PieChartCtrl)).call(this, $scope, $injector));

          _this.$rootScope = $rootScope;
          _this.variableSrv = variableSrv;
          _this.variableNames = _.map(variableSrv.variables, 'name');
          _this.selectedSeries = {};
          _this.timeBuckets = undefined;
          _this.focusedTime = undefined;
          _this.focusedBucketIndex = undefined;

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

          _.defaults(_this.panel, panelDefaults);
          _.defaults(_this.panel.legend, panelDefaults.legend);

          _this.events.on('render', _this.onRender.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('data-error', _this.onDataError.bind(_this));
          _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));
          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));

          appEvents.on('graph-hover', _this.onGraphHover.bind(_this));
          return _this;
        }

        _createClass(PieChartCtrl, [{
          key: 'onGraphHover',
          value: function onGraphHover(event) {
            var _this2 = this;

            var pos = event.pos;
            var date = moment.utc(pos.x1);
            this.focusedTime = date.unix();
            var index = _.findLastIndex(this.timeBuckets, function (t) {
              return t <= _this2.focusedTime;
            });
            if (this.focusedBucketIndex != index) {
              this.render();
            }
          }
        }, {
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Options', 'public/plugins/grafana-piechart-panel/editor.html', 2);
            this.unitFormats = kbn.getUnitFormats();
          }
        }, {
          key: 'setUnitFormat',
          value: function setUnitFormat(subItem) {
            this.panel.format = subItem.value;
            this.render();
          }
        }, {
          key: 'onDataError',
          value: function onDataError() {
            this.series = [];
            this.render();
          }
        }, {
          key: 'changeSeriesColor',
          value: function changeSeriesColor(series, color) {
            series.color = color;
            this.panel.aliasColors[series.alias] = series.color;
            this.render();
          }
        }, {
          key: 'onRender',
          value: function onRender() {
            this.data = this.parseSeries(this.series);

            if (this.panel.clickAction === 'Update variable') {
              this.selectedSeries = {};

              var variable = _.find(this.variableSrv.variables, { 'name': this.panel.variableToUpdate });
              var selected = _.map(_.filter(variable.options, { 'selected': true }), 'value');
              if (selected.constructor === Array) {
                if (selected[0] === '$__all') {
                  // do nothing
                } else {
                  for (var i = 0; i < selected.length; i++) {
                    this.selectedSeries[selected[i]] = true;
                  }
                }
              }
            }
          }
        }, {
          key: 'seriesData',
          value: function seriesData(serie) {
            var data = void 0;
            if (this.panel.valueName != 'time') {
              data = serie.stats[this.panel.valueName];
            } else {
              data = serie.flotpairs[this.focusedBucketIndex][1];
            }
            return data;
          }
        }, {
          key: 'parseSeries',
          value: function parseSeries(series) {
            var _this3 = this;

            if (series && series.length > 0) {
              this.timeBuckets = _.map(series[0].flotpairs, function (arr) {
                return moment.utc(arr[0]).unix();
              });

              var index = _.findLastIndex(this.timeBuckets, function (t) {
                return t <= _this3.focusedTime;
              });
              if (index < 0) {
                index = 0;
              }
              if (index >= this.timeBuckets.length) {
                index = this.timeBuckets.length - 1;
              }
              this.focusedBucketIndex = index;
            }

            return _.map(series, function (serie, i) {
              return {
                label: serie.alias,
                data: _this3.seriesData(serie),
                color: _this3.panel.aliasColors[serie.alias] || _this3.$rootScope.colors[i]
              };
            });
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            this.series = dataList.map(this.seriesHandler.bind(this));
            this.data = this.parseSeries(this.series);
            this.render(this.data);
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData) {
            var series = new TimeSeries({
              datapoints: seriesData.datapoints,
              alias: seriesData.target
            });

            series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
            return series;
          }
        }, {
          key: 'getDecimalsForValue',
          value: function getDecimalsForValue(value) {
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
            if (Math.floor(value) === value) {
              dec = 0;
            }

            var result = {};
            result.decimals = Math.max(0, dec);
            result.scaledDecimals = result.decimals - Math.floor(Math.log(size) / Math.LN10) + 2;

            return result;
          }
        }, {
          key: 'formatValue',
          value: function formatValue(value) {
            var decimalInfo = this.getDecimalsForValue(value);
            var formatFunc = kbn.valueFormats[this.panel.format];
            if (formatFunc) {
              return formatFunc(value, decimalInfo.decimals, decimalInfo.scaledDecimals);
            }
            return value;
          }
        }, {
          key: 'link',
          value: function link(scope, elem, attrs, ctrl) {
            rendering(scope, elem, attrs, ctrl);
          }
        }, {
          key: 'toggleSeries',
          value: function toggleSeries(serie) {
            if (this.selectedSeries[serie.label]) {
              delete this.selectedSeries[serie.alias];
            } else {
              this.selectedSeries[serie.label] = true;
            }
          }
        }, {
          key: 'toggleCombinedSeries',
          value: function toggleCombinedSeries(combined) {
            for (var i = 0; i < combined.length; i++) {
              this.toggleSeries(combined[i]);
            }

            if (this.selectedSeries[this.panel.combine.label]) {
              delete this.selectedSeries[this.panel.combine.label];
            } else {
              this.selectedSeries[this.panel.combine.label] = true;
            }
          }
        }, {
          key: 'updateVariable',
          value: function updateVariable() {
            var _this4 = this;

            if (this.panel.variableToUpdate) {
              var selectedSeries = _.keys(this.selectedSeries);

              var variable = _.find(this.variableSrv.variables, { "name": this.panel.variableToUpdate });
              variable.current.text = selectedSeries.join(' + ');
              variable.current.value = selectedSeries;

              this.variableSrv.updateOptions(variable).then(function () {
                _this4.variableSrv.variableUpdated(variable).then(function () {
                  _this4.$scope.$emit('template-variable-value-updated');
                  _this4.$scope.$root.$broadcast('refresh');
                });
              });
            }
          }
        }]);

        return PieChartCtrl;
      }(MetricsPanelCtrl));

      _export('PieChartCtrl', PieChartCtrl);

      PieChartCtrl.templateUrl = 'module.html';
    }
  };
});
//# sourceMappingURL=piechart_ctrl.js.map
