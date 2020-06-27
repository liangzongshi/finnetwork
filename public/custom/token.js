$(document).ready(() => {
    const series = $('#series').data('series').split(',')
    const label = $('#label').data('label').split(',')
    const pie = $('#pie').data('pie').split(',')
    const _pie = [ Number(pie[0]) , Number(pie[1]), Number(pie[2])]

    var xchart, ychart
    var options = {
        series: [{
            data: series
        }],
        chart: {
            type: 'bar',
            height: 476
        },
        plotOptions: {
            bar: {
                horizontal: false,
                dataLabels: {
                    position: 'top',
                },
            }
        },
        dataLabels: {
            enabled: true,
            offsetX: -6,
            style: {
                fontSize: '14px',
                colors: ['#fff']
            }
        },
        stroke: {
            show: true,
            width: 1,
            colors: ['#fff']
        },
        xaxis: {
            categories: label,
        },
        yaxis: {
            max: 3,
            min: 0.1,
            axisBorder: {
                show: true,
                color: '#78909C'
            }
        }
    }

    ychart = new ApexCharts(document.querySelector("#apex-candelstick-chart"), options)
    ychart.render()

    var _options = {
        series: _pie,
        chart: {
        type: 'donut',
      },
      labels: ["Blocked", "Active", "Rest"],
      dataLabels: {
        dropShadow: {
          blur: 3,
          opacity: 0.8
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
      }

      var xchart = new ApexCharts(document.querySelector("#apex-pie-chart"), _options);
      xchart.render()
})