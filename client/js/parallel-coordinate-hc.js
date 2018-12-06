function loadParallelCoordinatesHC(resp){


        let data = generateParallelCoordinateDataHC(resp, window.vueApp.params.topicThreshold, window.vueApp.params.wordThreshold);
        Highcharts.chart('pc-container', {
            chart: {
                type: 'spline',
                parallelCoordinates: true,
                parallelAxes: {
                    lineWidth: 2
                }
            },
            title: {
                text: 'Document - Topic - Word Relationship'
            },
            plotOptions: {
                series: {
                    animation: false,
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: false
                            }
                        }
                    },
                    states: {
                        hover: {
                            halo: {
                                size: 0
                            }
                        }
                    },
                    events: {
                        mouseOver: function () {
                            this.group.toFront();
                        }
                    }
                }
            },
            // tooltip: {
            //     pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
            //         '{series.name}: <b>{point.formattedValue}</b><br/>'
            // },
            xAxis: {
                categories: [
                    'Document',
                    'Topic',
                    'Word'
                ],
                offset: 10
            },
            yAxis: [{
                categories: Object.keys(resp["document_topic"]).map(x=> "................Document "+x)
            }, {
                categories: resp["topics"].map(x=> "................Topic "+x)
            }, {
                categories: Object.values(resp["words"]).map(x=> "................"+x)
            }],
            colors: ['rgba(11, 200, 200, 0.1)'],
            series: data.map(function (set, i) {
                return {
                    name: '',
                    data: set,
                    shadow: false
                };
            })
        });

}


